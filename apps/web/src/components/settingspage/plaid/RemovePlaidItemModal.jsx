import { useEffect, useState } from "react";
import { useDataStore } from "../../../util/dataStore";
import { useAnimatedPresence } from "../../../util/useAnimatedPresence";
import { useRemovePlaidItemMutation } from "../../../mutations/useRemovePlaidItemMutation";
import ButtonSpinner from "../../common/ButtonSpinner";

const RemovePlaidItemModal = () => {
	const { removingPlaidItem, setRemovingPlaidItem, setNotification } = useDataStore((state) => ({
		removingPlaidItem: state.removingPlaidItem,
		setRemovingPlaidItem: state.setRemovingPlaidItem,
		setNotification: state.setNotification,
	}));
	const [confirmationText, setConfirmationText] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const removePlaidItemMutation = useRemovePlaidItemMutation();
	const { isMounted, animationClass, open, close, onAnimationEnd, closeAndWait } = useAnimatedPresence();

	useEffect(() => {
		if (removingPlaidItem) {
			setConfirmationText("");
			open();
		}
	}, [removingPlaidItem, open]);

	const institutionName = removingPlaidItem?.institutionName ?? "";
	const isNameConfirmed = confirmationText.trim() === institutionName;

	const removeInstitution = async () => {
		if (!removingPlaidItem || submitting || !isNameConfirmed) return;

		const itemId = removingPlaidItem.id;
		setSubmitting(true);

		await closeAndWait();

		removePlaidItemMutation.mutate(
			{ itemId },
			{
				onSuccess: (response) => {
					setSubmitting(false);
					setNotification({
						type: "success",
						message: `${response.institutionName ?? "Institution"} removed.`,
					});
				},
				onError: () => {
					setSubmitting(false);
					setNotification({
						type: "error",
						message: "Could not remove this institution. Please try again later.",
					});
				},
			},
		);
	};

	const handleAnimationEnd = (event) => {
		if (event.target !== event.currentTarget) return;

		const isClosing = animationClass === "exit";
		onAnimationEnd(event);

		if (isClosing) {
			setConfirmationText("");
			setRemovingPlaidItem(null);
		}
	};

	return (
		<>
			{isMounted && (
				<div
					onAnimationEnd={handleAnimationEnd}
					onClick={submitting ? undefined : close}
					className={`${animationClass}
        z-[99] overflow-hidden modal top-0 left-0 absolute w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.25)]`}
				>
					<div
						onClick={(e) => {
							e.stopPropagation();
						}}
						className="w-1/2 xl:w-1/3 overflow-hidden flex flex-col gap-3 bg-white rounded-xl border border-slate-200 p-4"
					>
						<div className="text-base text-slate-600 font-semibold">
							Remove {institutionName || "Institution"}
						</div>
						<div className="text-sm text-slate-500">
							Type <span className="font-medium text-slate-700">{institutionName}</span> to confirm.
							This will disconnect the institution from Plaid and permanently delete its imported
							transactions.
						</div>
						<input
							className="outline-none text-sm p-1.5 border border-slate-200 rounded"
							placeholder={institutionName}
							value={confirmationText}
							onChange={(e) => setConfirmationText(e.target.value)}
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={close}
								disabled={submitting}
								className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded disabled:opacity-60 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								className={`relative bg-red-50 hover:bg-red-100 disabled:hover:bg-red-50 py-1 px-2 border border-red-200 rounded text-sm text-red-400 disabled:opacity-60 disabled:cursor-not-allowed`}
								onClick={removeInstitution}
								disabled={!isNameConfirmed || submitting}
							>
								<span className={`${submitting ? "opacity-0" : ""}`}>Remove</span>
								{submitting && <ButtonSpinner />}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default RemovePlaidItemModal;
