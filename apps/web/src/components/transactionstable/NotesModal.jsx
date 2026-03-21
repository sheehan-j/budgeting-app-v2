import { useDataStore } from "../../util/dataStore";
import { useState, useEffect } from "react";
import { useUpdateTransactionNotesMutation } from "../../mutations/useUpdateTransactionNotesMutation";
import { useAnimatedPresence } from "../../util/useAnimatedPresence";
import ButtonSpinner from "../common/ButtonSpinner";

const NotesModal = () => {
	const { editingNotesTransaction, setEditingNotesTransaction, setNotification } = useDataStore((state) => ({
		editingNotesTransaction: state.editingNotesTransaction,
		setEditingNotesTransaction: state.setEditingNotesTransaction,
		setNotification: state.setNotification,
	}));
	const [notes, setNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const updateTransactionNotesMutation = useUpdateTransactionNotesMutation();
	const { isMounted, animationClass, open, close, onAnimationEnd, closeAndWait } = useAnimatedPresence();

	useEffect(() => {
		if (editingNotesTransaction) {
			setNotes(editingNotesTransaction.notes || "");
			open();
		}
	}, [editingNotesTransaction, open]);

	const save = async () => {
		if (!editingNotesTransaction || submitting) return;

    // Capture notes here because they will be cleared by the handleAnimationEnd triggered at the end of closeAndWAit
		const transactionId = editingNotesTransaction.id;
		const nextNotes = notes;
		setSubmitting(true);

		await closeAndWait();

		updateTransactionNotesMutation.mutate(
			{
				transactionId,
				notes: nextNotes,
			},
			{
				onSuccess: () => {
					setSubmitting(false);
					setNotification({ type: "success", message: "Notes saved successfully." });
				},
				onError: () => {
					setSubmitting(false);
					setNotification({ type: "error", message: "Could not save notes. Please try again later." });
				},
			},
		);
	};

	const handleAnimationEnd = (event) => {
		if (event.target !== event.currentTarget) return;

		const isClosing = animationClass === "exit";
		onAnimationEnd(event);

		if (isClosing) {
			setNotes("");
			setEditingNotesTransaction(null);
		}
	};

	return (
		<>
			{isMounted && (
				<div
					onAnimationEnd={handleAnimationEnd}
					onClick={close}
					className={`${animationClass}
        z-[99] overflow-hidden modal-backdrop top-0 left-0 absolute w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.25)]`}
				>
					<div
						onClick={(e) => {
							e.stopPropagation();
						}}
						className={`${animationClass} modal-panel w-1/2 xl:w-1/3 overflow-hidden flex flex-col gap-2 bg-white rounded-xl border border-slate-200 p-4`}
					>
						<div className="text-base text-slate-600 font-semibold">
							Notes for {editingNotesTransaction?.merchant}
						</div>
						<textarea
							className="outline-none text-sm p-1.5 grow resize-none border border-slate-200 rounded"
							placeholder="Type notes here..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={5}
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={close}
								className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded"
							>
								Cancel
							</button>
							<button
								className="relative bg-blue-100 py-1 px-2 bg-cGreen-light border border-slate-300 rounded text-sm text-slate-700 p-1"
								onClick={save}
							>
								<span className={`${submitting ? "opacity-0" : ""}`}>Save</span>
								{submitting && <ButtonSpinner />}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default NotesModal;
