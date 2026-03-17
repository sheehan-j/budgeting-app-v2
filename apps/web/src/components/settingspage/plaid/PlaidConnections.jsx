import { useEffect, useRef, useState } from "react";
import ButtonSpinner from "../../common/ButtonSpinner";
import { useDataStore } from "../../../util/dataStore";
import { createPlaidLinkToken } from "../../../util/apiQueries";
import { loadPlaidLink } from "../../../util/loadPlaidLink";
import { usePlaidItemsQuery } from "../../../queries/usePlaidItemsQuery";
import { useExchangePlaidPublicTokenMutation } from "../../../mutations/useExchangePlaidPublicTokenMutation";
import { useSyncAllPlaidItemsMutation } from "../../../mutations/useSyncAllPlaidItemsMutation";
import { formatPlaidSyncSuccessNotification } from "../../../util/plaidUtil";

const PLAID_LINK_TOKEN_STORAGE_KEY = "plaid_link_token";

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

const getStoredPlaidLinkToken = () => window.sessionStorage.getItem(PLAID_LINK_TOKEN_STORAGE_KEY);

const storePlaidLinkToken = (linkToken) => {
	window.sessionStorage.setItem(PLAID_LINK_TOKEN_STORAGE_KEY, linkToken);
};

const clearStoredPlaidLinkToken = () => {
	window.sessionStorage.removeItem(PLAID_LINK_TOKEN_STORAGE_KEY);
};

const hasOauthStateId = () => {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.has("oauth_state_id");
};

const PlaidConnections = () => {
	const { setNotification } = useDataStore((state) => ({
		setNotification: state.setNotification,
	}));
	const [scriptReady, setScriptReady] = useState(false);
	const [startingLink, setStartingLink] = useState(false);
	const [resumingLink, setResumingLink] = useState(false);
	const handlerRef = useRef(null);

	const { data: plaidItems, isLoading } = usePlaidItemsQuery();
	const exchangeMutation = useExchangePlaidPublicTokenMutation();
	const syncAllMutation = useSyncAllPlaidItemsMutation();

	const cleanupOauthRedirect = () => {
		clearStoredPlaidLinkToken();

		if (hasOauthStateId()) {
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	};

	const handlePlaidSuccess = (publicToken) => {
		handlerRef.current?.destroy?.();
		handlerRef.current = null;
		setStartingLink(false);
		setResumingLink(false);

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

	const handlePlaidExit = (error, metadata) => {
		handlerRef.current?.destroy?.();
		handlerRef.current = null;
		setStartingLink(false);
		setResumingLink(false);

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

	useEffect(() => {
		let mounted = true;

		loadPlaidLink()
			.then(() => {
				if (mounted) setScriptReady(true);
			})
			.catch(() => {
				if (mounted) setScriptReady(false);
			});

		return () => {
			mounted = false;
			handlerRef.current?.destroy?.();
		};
	}, []);

	useEffect(() => {
		if (!hasOauthStateId()) return;

		const storedLinkToken = getStoredPlaidLinkToken();
		if (!storedLinkToken) {
			setNotification({
				type: "error",
				message: "Plaid OAuth returned without an active Link session. Please try connecting again.",
			});
			window.history.replaceState({}, document.title, window.location.pathname);
			return;
		}

		let mounted = true;
		setResumingLink(true);

		loadPlaidLink()
			.then((Plaid) => {
				if (!mounted) return;

				setScriptReady(true);
				handlerRef.current?.destroy?.();
				handlerRef.current = Plaid.create({
					token: storedLinkToken,
					receivedRedirectUri: window.location.href,
					onSuccess: handlePlaidSuccess,
					onExit: handlePlaidExit,
				});
				handlerRef.current.open();
			})
			.catch((error) => {
				if (!mounted) return;

				setResumingLink(false);
				cleanupOauthRedirect();
				setNotification({
					type: "error",
					message: error instanceof Error ? error.message : "Could not resume Plaid OAuth.",
				});
			});

		return () => {
			mounted = false;
		};
	}, [setNotification]);

	const handleConnectInstitution = async () => {
		if (startingLink || resumingLink || exchangeMutation.isPending) return;

		setStartingLink(true);

		try {
			const [Plaid, linkTokenResponse] = await Promise.all([loadPlaidLink(), createPlaidLinkToken()]);
			setScriptReady(true);
			storePlaidLinkToken(linkTokenResponse.linkToken);

			handlerRef.current?.destroy?.();
			handlerRef.current = Plaid.create({
				token: linkTokenResponse.linkToken,
				onSuccess: handlePlaidSuccess,
				onExit: handlePlaidExit,
			});

			handlerRef.current.open();
		} catch (error) {
			setScriptReady(false);
			setStartingLink(false);
			clearStoredPlaidLinkToken();
			setNotification({
				type: "error",
				message: error instanceof Error ? error.message : "Could not launch Plaid Link.",
			});
		}
	};

	const handleSyncAll = () => {
		if (syncAllMutation.isPending) return;

		syncAllMutation.mutate(undefined, {
			onSuccess: (items) => {
				setNotification(formatPlaidSyncSuccessNotification(items))
			},
		});
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
							budgeting data.
						</div>
					</div>
					<div className="flex gap-2 flex-wrap">
						<button
							onClick={handleSyncAll}
							disabled={
								syncAllMutation.isPending || exchangeMutation.isPending || startingLink || resumingLink
							}
							className="relative border border-slate-300 rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<span className={syncAllMutation.isPending ? "opacity-0" : ""}>Sync All</span>
							{syncAllMutation.isPending && <ButtonSpinner />}
						</button>
						<button
							onClick={handleConnectInstitution}
							disabled={startingLink || resumingLink || exchangeMutation.isPending}
							className="relative bg-cGreen-light border border-slate-300 rounded px-3 py-2 text-sm text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<span
								className={
									startingLink || resumingLink || exchangeMutation.isPending ? "opacity-0" : ""
								}
							>
								Connect Institution
							</span>
							{(startingLink || resumingLink || exchangeMutation.isPending) && <ButtonSpinner />}
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
									${!resumingLink && scriptReady ? "bg-cGreen-lighter text-cGreen-dark" : "bg-yellow-100 text-yellow-500"}
								`}
							>
								{resumingLink
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

							return (
								<div key={item.id} className="border border-slate-300 rounded-2xl overflow-hidden">
									<div className="flex items-start justify-between gap-4 p-5 bg-slate-50 border-b border-slate-200 flex-wrap">
										<div>
											<div className="text-base font-semibold text-slate-700">
												{item.institutionName ?? "Connected Institution"}
											</div>
											<div className="text-sm text-slate-500 mt-1">
												Last synced: {formatDateTime(item.lastSyncedAt)}
											</div>
										</div>
										<div
											className={`text-xs rounded-full px-2 py-1 ${getInstitutionStatusStyles(item.status)}`}
										>
											{formatPlaidLabel(item.status)}
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
																{account.subtype ? ` | ${formatPlaidLabel(account.subtype)}` : ""}
																{account.mask ? ` | ****${account.mask}` : ""}
															</div>
														</div>
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
