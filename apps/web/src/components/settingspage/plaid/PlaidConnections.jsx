import { useEffect, useRef, useState } from "react";
import ButtonSpinner from "../../common/ButtonSpinner";
import { useDataStore } from "../../../util/dataStore";
import { createPlaidLinkToken, createPlaidUpdateLinkToken } from "../../../util/apiQueries";
import { loadPlaidLink } from "../../../util/loadPlaidLink";
import { usePlaidItemsQuery } from "../../../queries/usePlaidItemsQuery";
import { useExchangePlaidPublicTokenMutation } from "../../../mutations/useExchangePlaidPublicTokenMutation";
import { useCompletePlaidUpdateModeMutation } from "../../../mutations/useCompletePlaidUpdateModeMutation";
import { useImportCapitalOneCsvMutation } from "../../../mutations/useImportCapitalOneCsvMutation";
import { useSyncAllPlaidItemsMutation } from "../../../mutations/useSyncAllPlaidItemsMutation";
import { formatPlaidSyncSuccessNotification } from "../../../util/plaidUtil";

const PLAID_LINK_SESSION_STORAGE_KEY = "plaid_link_session";
const IMPORT_ENABLED = String(import.meta.env.VITE_IMPORT_ENABLED ?? "").toLowerCase() === "true";

const formatDateTime = (value) => {
	if (!value) return "Never";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Unknown";

	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	});
};

const formatSyncSummary = (sync) => {
	if (!sync) return "Account connected. Initial sync will appear shortly.";

	const parts = [];
	if (sync.addedCount > 0) parts.push(`${sync.addedCount} added`);
	if (sync.modifiedCount > 0) parts.push(`${sync.modifiedCount} updated`);
	if (sync.removedCount > 0) parts.push(`${sync.removedCount} removed`);

	return parts.length > 0 ? parts.join(", ") : "No transaction changes were needed.";
};

const formatUpdateModeSummary = (institutionName, sync) =>
	`${institutionName ?? "Institution"} updated. ${
		sync ? formatSyncSummary(sync) : "Changes will appear after the next sync."
	}`;

const formatIsoDateLabel = (value) => {
	if (!value) return null;

	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;

	return `${month}/${day}/${year}`;
};

const formatCapitalOneImportSummary = (response) => {
	const parts = [`${response.insertedCount} imported`];

	if (response.overlapSkippedCount > 0) {
		parts.push(`${response.overlapSkippedCount} overlapping skipped`);
	}

	if (response.duplicateSkippedCount > 0) {
		parts.push(`${response.duplicateSkippedCount} duplicates skipped`);
	}

	const rangeStart = formatIsoDateLabel(response.importedRangeStart);
	const rangeEnd = formatIsoDateLabel(response.importedRangeEnd);
	const rangeLabel = rangeStart && rangeEnd ? ` (${rangeStart} - ${rangeEnd})` : "";

	return `${response.accountName}: ${parts.join(", ")}${rangeLabel}.`;
};

const formatPlaidExitMessage = (error, metadata) => {
	const requestId = metadata?.request_id || error?.request_id;
	const errorCode = error?.error_code;
	const displayMessage = error?.display_message || error?.error_message || "Could not complete Plaid Link.";
	const details = [errorCode, requestId].filter(Boolean).join(" | ");

	return details ? `${displayMessage} (${details})` : displayMessage;
};

const getInstitutionStatusStyles = (status) => {
	switch (status) {
		case "active":
			return "bg-cGreen-lighter text-cGreen-dark";
		case "sync_error":
			return "bg-red-100 text-red-700";
		default:
			return "bg-slate-200 text-slate-500";
	}
};

const formatPlaidLabel = (value) => {
	if (!value) return "";

	return value
		.split(/[\s_-]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

const getStoredPlaidLinkSession = () => {
	const rawValue = window.sessionStorage.getItem(PLAID_LINK_SESSION_STORAGE_KEY);
	if (!rawValue) return null;

	try {
		const parsedValue = JSON.parse(rawValue);
		if (!parsedValue?.token || !parsedValue?.mode) return null;

		return parsedValue;
	} catch {
		return {
			token: rawValue,
			mode: "connect",
		};
	}
};

const storePlaidLinkSession = (linkSession) => {
	window.sessionStorage.setItem(PLAID_LINK_SESSION_STORAGE_KEY, JSON.stringify(linkSession));
};

const clearStoredPlaidLinkSession = () => {
	window.sessionStorage.removeItem(PLAID_LINK_SESSION_STORAGE_KEY);
};

// Check the current URL for oauth_state_id placed by Plaid to determine whether Plaid link flow should resume
const hasOauthStateId = () => {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.has("oauth_state_id");
};

const PlaidConnections = () => {
	const { setNotification, setRemovingPlaidItem } = useDataStore((state) => ({
		setNotification: state.setNotification,
		setRemovingPlaidItem: state.setRemovingPlaidItem,
	}));
	const [scriptReady, setScriptReady] = useState(false);
	const [startingFlow, setStartingFlow] = useState(false); // Track when the Plaid flow has started
	const [resumingFlow, setResumingFlow] = useState(false); // Track when the Plaid flow has resumed after OAuth redirect
	const [updatingItemId, setUpdatingItemId] = useState(null);
	const [uploadingAccountId, setUploadingAccountId] = useState(null);
	const handlerRef = useRef(null);
	const linkSessionRef = useRef(null);
	const fileInputRefs = useRef({});

	const { data: plaidItems, isLoading } = usePlaidItemsQuery();
	const exchangeMutation = useExchangePlaidPublicTokenMutation();
	const completeUpdateModeMutation = useCompletePlaidUpdateModeMutation();
	const importCapitalOneCsvMutation = useImportCapitalOneCsvMutation();
	const syncAllMutation = useSyncAllPlaidItemsMutation();
	const isPlaidBusy =
		startingFlow ||
		resumingFlow ||
		exchangeMutation.isPending ||
		completeUpdateModeMutation.isPending ||
		importCapitalOneCsvMutation.isPending;

	// Remove oauth_state_id from URL and remove stored Plaid link from local storage
	const cleanupOauthRedirect = () => {
		clearStoredPlaidLinkSession();
		linkSessionRef.current = null;
		setUpdatingItemId(null);

		if (hasOauthStateId()) {
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	};

	const handlePlaidSuccess = (publicToken) => {
		const linkSession = linkSessionRef.current ?? getStoredPlaidLinkSession();

		// Destroy plaid handler and mark flow as complete in state
		handlerRef.current?.destroy?.();
		handlerRef.current = null;
		setStartingFlow(false);
		setResumingFlow(false);

		// When Plaid flow was initiated to update a connection, trigger complete update mode flow in backend
		if (linkSession?.mode === "update" && typeof linkSession.itemId === "number") {
			completeUpdateModeMutation.mutate(
				{ itemId: linkSession.itemId },
				{
					onSuccess: (response) => {
						cleanupOauthRedirect();
						setNotification({
							type: "success",
							message: formatUpdateModeSummary(response.item.institutionName, response.sync),
						});
					},
					onError: () => {
						cleanupOauthRedirect();
					},
				},
			);
			return;
		}

		// Otherwise (connect mode), exchange public token/trigger save Plaid item flow in backend
		exchangeMutation.mutate(
			{ publicToken },
			{
				onSuccess: (response) => {
					cleanupOauthRedirect();
					setNotification({
						type: "success",
						message: `${
							response.item.institutionName ?? "Institution"
						} connected. ${formatSyncSummary(response.sync)}`,
					});
				},
				onError: () => {
					cleanupOauthRedirect();
				},
			},
		);
	};

	// Set notification and log error on Plaid error
	const handlePlaidExit = (error, metadata) => {
		handlerRef.current?.destroy?.();
		handlerRef.current = null;
		setStartingFlow(false);
		setResumingFlow(false);

		if (error) {
			console.error("Plaid Link exit", {
				error,
				metadata,
				error_code: error?.error_code,
				error_type: error?.error_type,
				display_message: error?.display_message,
				error_message: error?.error_message,
				request_id: metadata?.request_id || error?.request_id,
				institution_id: metadata?.institution?.institution_id,
				institution_name: metadata?.institution?.name,
				link_session_id: metadata?.link_session_id,
			});
			setNotification({
				type: "error",
				message: formatPlaidExitMessage(error, metadata),
			});
		}

		cleanupOauthRedirect();
	};

	// Load Plaid's handler on mount/destroy on unmount
	useEffect(() => {
		let mounted = true;

		loadPlaidLink() // Fetch Plaid script from CDN and attach listeners
			.then(() => {
				if (mounted) setScriptReady(true);
			})
			.catch(() => {
				if (mounted) setScriptReady(false);
			});

		return () => {
			mounted = false;
			handlerRef.current?.destroy?.();
			linkSessionRef.current = null;
		};
	}, []);

	// Handle resume Plaid flow after oAuth redirect
	useEffect(() => {
		if (!hasOauthStateId()) return;

		// If returned back and info about link session is not stored, cannot continue
		const storedLinkSession = getStoredPlaidLinkSession();
		if (!storedLinkSession) {
			setNotification({
				type: "error",
				message: "Plaid OAuth returned without an active Link session. Please try connecting again.",
			});
			window.history.replaceState({}, document.title, window.location.pathname);
			return;
		}

		let mounted = true;
		setResumingFlow(true);
		linkSessionRef.current = storedLinkSession;
		setUpdatingItemId(storedLinkSession.mode === "update" ? (storedLinkSession.itemId ?? null) : null);

		loadPlaidLink()
			.then((Plaid) => {
				if (!mounted) return;

				// Recreate Plaid handler after OAuth redirect using current URL and stored link
				setScriptReady(true);
				handlerRef.current?.destroy?.();
				handlerRef.current = Plaid.create({
					token: storedLinkSession.token,
					receivedRedirectUri: window.location.href,
					onSuccess: handlePlaidSuccess,
					onExit: handlePlaidExit,
				});
				handlerRef.current.open(); // Re-open Plaid UI
			})
			.catch((error) => {
				if (!mounted) return;

				setResumingFlow(false);
				cleanupOauthRedirect();
				setNotification({
					type: "error",
					message: error instanceof Error ? error.message : "Could not resume Plaid OAuth.",
				});
			});

		return () => {
			mounted = false;
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleConnectInstitution = async () => {
		if (isPlaidBusy) return;

		setStartingFlow(true);

		try {
			// Load Plaid script through CDN, create Plaid link token with Plaid client, and store link session info in localStorage
			const [Plaid, linkTokenResponse] = await Promise.all([loadPlaidLink(), createPlaidLinkToken()]);
			setScriptReady(true);
			const linkSession = {
				token: linkTokenResponse.linkToken,
				mode: "connect",
			};
			linkSessionRef.current = linkSession;
			storePlaidLinkSession(linkSession);

			// Destroy current Plaid handler and create new Handler
			handlerRef.current?.destroy?.();
			handlerRef.current = Plaid.create({
				token: linkTokenResponse.linkToken,
				onSuccess: handlePlaidSuccess,
				onExit: handlePlaidExit,
			});

			handlerRef.current.open(); // Open Plaid UI
		} catch (error) {
			setScriptReady(false);
			setStartingFlow(false);
			clearStoredPlaidLinkSession();
			linkSessionRef.current = null;
			setNotification({
				type: "error",
				message: error instanceof Error ? error.message : "Could not launch Plaid Link.",
			});
		}
	};

	const handleUpdateInstitution = async (itemId) => {
		if (isPlaidBusy) return;

		setUpdatingItemId(itemId);

		try {
			// Follow same process as handle connect, instead creating update link token and setting update mode
			const [Plaid, linkTokenResponse] = await Promise.all([loadPlaidLink(), createPlaidUpdateLinkToken(itemId)]);
			setScriptReady(true);

			const linkSession = {
				token: linkTokenResponse.linkToken,
				mode: "update",
				itemId,
			};
			linkSessionRef.current = linkSession;
			storePlaidLinkSession(linkSession);

			handlerRef.current?.destroy?.();
			handlerRef.current = Plaid.create({
				token: linkTokenResponse.linkToken,
				onSuccess: handlePlaidSuccess,
				onExit: handlePlaidExit,
			});

			handlerRef.current.open();
		} catch (error) {
			setScriptReady(false);
			setUpdatingItemId(null);
			clearStoredPlaidLinkSession();
			linkSessionRef.current = null;
			setNotification({
				type: "error",
				message: error instanceof Error ? error.message : "Could not launch Plaid update mode.",
			});
		}
	};

	const handleRemoveInstitution = (item) => {
		setRemovingPlaidItem({
			id: item.id,
			institutionName: item.institutionName ?? "Institution",
		});
	};

	const handleSyncAll = () => {
		if (syncAllMutation.isPending) return;

		syncAllMutation.mutate(undefined, {
			onSuccess: (items) => {
				setNotification(formatPlaidSyncSuccessNotification(items));
			},
		});
	};

	const handleImportCapitalOneCsvClick = (accountId) => {
		if (isPlaidBusy) return;

		fileInputRefs.current[accountId]?.click();
	};

	const handleImportCapitalOneCsvFile = async (item, account, event) => {
		const input = event.target;
		const file = input.files?.[0];
		input.value = "";

		if (!file || importCapitalOneCsvMutation.isPending) return;

		setUploadingAccountId(account.id);

		try {
			const csvText = await file.text();

			importCapitalOneCsvMutation.mutate(
				{
					itemId: item.id,
					accountId: account.id,
					csvText,
					fileName: file.name,
				},
				{
					onSuccess: (response) => {
						setNotification({
							type: "success",
							message: formatCapitalOneImportSummary(response),
						});
					},
					onError: (error) => {
						setNotification({
							type: "error",
							message:
								error instanceof Error ? error.message : "Could not import Capital One transactions.",
						});
					},
					onSettled: () => {
						setUploadingAccountId(null);
					},
				},
			);
		} catch (error) {
			setUploadingAccountId(null);
			setNotification({
				type: "error",
				message: error instanceof Error ? error.message : "Could not read this CSV file.",
			});
		}
	};

	const connectedAccountsCount =
		plaidItems?.reduce((count, item) => count + item.accounts.filter((account) => account.isActive).length, 0) ?? 0;

	return (
		<div className="grow flex flex-col">
			<div className="grow overflow-y-auto p-6">
				<div className="flex items-start justify-between gap-4 flex-wrap mb-6">
					<div>
						<div className="text-lg text-slate-600 font-semibold">Connected Accounts</div>
						<div className="text-sm text-slate-500 mt-1 max-w-2xl">
							Connect institutions with Plaid to import transactions and keep them in sync with your
							budgeting data
						</div>
					</div>
					<div className="flex gap-2 flex-wrap">
						<button
							onClick={handleSyncAll}
							disabled={syncAllMutation.isPending || isPlaidBusy}
							className="relative border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<span className={syncAllMutation.isPending ? "opacity-0" : ""}>Sync All</span>
							{syncAllMutation.isPending && <ButtonSpinner />}
						</button>
						<button
							onClick={handleConnectInstitution}
							disabled={isPlaidBusy}
							className="relative bg-cGreen-light hover:bg-cGreen-lightHover border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<span className={isPlaidBusy ? "opacity-0" : ""}>Connect Institution</span>
							{isPlaidBusy && <ButtonSpinner />}
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
					<div className="border border-slate-300 rounded-xl bg-slate-50 p-4">
						<div className="text-xs uppercase tracking-wide text-slate-500">Institutions</div>
						<div className="text-2xl font-semibold text-slate-700 mt-2">{plaidItems?.length ?? 0}</div>
					</div>
					<div className="border border-slate-300 rounded-xl bg-slate-50 p-4">
						<div className="text-xs uppercase tracking-wide text-slate-500">Active Accounts</div>
						<div className="text-2xl font-semibold text-slate-700 mt-2">{connectedAccountsCount}</div>
					</div>
					<div className="border border-slate-300 rounded-xl bg-slate-50 py-4 flex flex-col">
						<div className="text-xs uppercase tracking-wide text-slate-500 px-4">Plaid Link</div>
						<div className="grow flex items-center px-3">
							<div
								className={`text-xs font-medium rounded-full px-3 py-2 
									${!resumingFlow && scriptReady ? "bg-cGreen-lighter text-cGreen-dark" : "bg-yellow-100 text-yellow-500"}
								`}
							>
								{resumingFlow
									? "Resuming OAuth..."
									: scriptReady
										? "Ready to connect"
										: "Preparing secure connection..."}
							</div>
						</div>
					</div>
				</div>

				{isLoading ? (
					<div className="border border-slate-300 rounded-xl p-6 text-sm text-slate-500">
						Loading connected institutions...
					</div>
				) : plaidItems?.length === 0 ? (
					<div className="border border-dashed border-slate-300 rounded-xl p-8 bg-slate-50">
						<div className="text-base font-medium text-slate-700">No institutions connected yet</div>
						<div className="text-sm text-slate-500 mt-2 max-w-xl">
							Use Plaid Link to connect a bank or credit card account. After linking, the app will import
							transactions and store the connected accounts here.
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{plaidItems.map((item) => {
							const activeAccounts = item.accounts.filter((account) => account.isActive);
							const supportsCapitalOneCsvImport = /capital one/i.test(item.institutionName ?? "");
							const isUpdatingThisItem = updatingItemId === item.id;
							const isItemActionDisabled = isPlaidBusy || isUpdatingThisItem;

							return (
								<div key={item.id} className="border border-slate-300 rounded-2xl overflow-hidden">
									<div className="flex items-start justify-between gap-4 p-5 bg-slate-50 border-b border-slate-200 flex-wrap">
										<div>
											<div className="flex items-center gap-2 flex-wrap">
												<div className="text-base font-semibold text-slate-700">
													{item.institutionName ?? "Connected Institution"}
												</div>
												<div
													className={`text-xs rounded-full px-2 py-1 ${getInstitutionStatusStyles(item.status)}`}
												>
													{formatPlaidLabel(item.status)}
												</div>
											</div>
											<div className="text-sm text-slate-500 mt-1">
												Last synced: {formatDateTime(item.lastSyncedAt)}
											</div>
										</div>
										<div className="flex items-center gap-2 flex-wrap">
											<button
												onClick={() => handleUpdateInstitution(item.id)}
												disabled={isItemActionDisabled}
												className="relative border border-slate-300 rounded px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
											>
												<span className={isUpdatingThisItem ? "opacity-0" : ""}>
													Update Access
												</span>
												{isUpdatingThisItem && <ButtonSpinner />}
											</button>
											<button
												onClick={() => handleRemoveInstitution(item)}
												disabled={isPlaidBusy}
												className="relative border bg-red-50 hover:bg-red-100 border-red-200 rounded px-2 py-1 text-xs text-red-400 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
											>
												<span>Remove</span>
											</button>
										</div>
									</div>
									<div className="p-5">
										<div className="text-xs uppercase tracking-wide text-slate-500 mb-3">
											Accounts ({activeAccounts.length})
										</div>
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
											{item.accounts.map((account) => (
												<div
													key={account.id}
													className={`border rounded-xl p-4 ${
														account.isActive
															? "border-slate-200 bg-white"
															: "border-slate-200 bg-slate-50 opacity-70"
													}`}
												>
													<div className="flex items-start justify-between gap-3">
														<div>
															<div className="font-medium text-slate-700">
																{account.name}
															</div>
															<div className="text-sm text-slate-500 mt-1">
																{formatPlaidLabel(account.type)}
																{account.subtype
																	? ` | ${formatPlaidLabel(account.subtype)}`
																	: ""}
																{account.mask ? ` | ****${account.mask}` : ""}
															</div>
														</div>
														<div className="flex items-center gap-2">
															{supportsCapitalOneCsvImport &&
																account.isActive &&
																IMPORT_ENABLED && (
																	<>
																		<input
																			ref={(node) => {
																				if (node) {
																					fileInputRefs.current[account.id] =
																						node;
																				} else {
																					delete fileInputRefs.current[
																						account.id
																					];
																				}
																			}}
																			type="file"
																			accept=".csv,text/csv"
																			className="hidden"
																			onChange={(event) =>
																				handleImportCapitalOneCsvFile(
																					item,
																					account,
																					event,
																				)
																			}
																		/>
																		<button
																			onClick={() =>
																				handleImportCapitalOneCsvClick(
																					account.id,
																				)
																			}
																			disabled={isPlaidBusy}
																			className="relative border border-slate-300 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
																		>
																			<span
																				className={
																					uploadingAccountId === account.id
																						? "opacity-0"
																						: ""
																				}
																			>
																				Import CSV
																			</span>
																			{uploadingAccountId === account.id && (
																				<ButtonSpinner />
																			)}
																		</button>
																	</>
																)}
															<div
																className={`text-xs rounded-full px-2 py-1 ${
																	account.isActive
																		? "bg-cGreen-lighter text-cGreen-dark"
																		: "bg-slate-200 text-slate-500"
																}`}
															>
																{account.isActive ? "Active" : "Inactive"}
															</div>
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default PlaidConnections;
