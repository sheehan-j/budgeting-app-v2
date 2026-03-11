import { useDataStore } from "../util/dataStore";
import { useAnimationStore } from "../util/animationStore";
import { useState, useEffect } from "react";
import { updateTransactions, getTransactions } from "../util/supabaseQueries";
import ButtonSpinner from "./ButtonSpinner";

const NotesModal = () => {
	const { editingNotesTransaction, setEditingNotesTransaction, setTransactions, setNotification } = useDataStore(
		(state) => ({
			editingNotesTransaction: state.editingNotesTransaction,
			setEditingNotesTransaction: state.setEditingNotesTransaction,
			setTransactions: state.setTransactions,
			setNotification: state.setNotification,
		})
	);
	const { notesModalVisible, notesModalAnimating, openNotesModal, closeNotesModal } = useAnimationStore((state) => ({
		notesModalVisible: state.notesModalVisible,
		notesModalAnimating: state.notesModalAnimating,
		openNotesModal: state.openNotesModal,
		closeNotesModal: state.closeNotesModal,
	}));
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);

	const close = () => {
		setLoading(false);
		closeNotesModal();
		setTimeout(() => {
			setNotes("");
			setEditingNotesTransaction(null);
		}, 100);
	};

	const save = async () => {
		if (loading) return;
		setLoading(true);

		let updatedTransaction = { ...editingNotesTransaction, notes: notes };
		delete updatedTransaction.buttonRef;

		try {
			const success = await updateTransactions(updatedTransaction);
			if (!success) throw new Error();
			setNotification({ type: "success", message: "Notes saved successfully." });
			close();
		} catch {
			setNotification({ type: "error", message: "Could not save notes. Please try again later." });
		} finally {
			const transactions = await getTransactions();
			setTransactions(transactions);
		}
	};

	useEffect(() => {
		if (editingNotesTransaction) {
			setNotes(editingNotesTransaction.notes || "");
			openNotesModal();
		}
	}, [editingNotesTransaction, openNotesModal]);

	return (
		<>
			{(notesModalVisible || notesModalAnimating) && (
				<div
					onClick={close}
					className={`${notesModalAnimating ? (notesModalVisible ? "enter" : "exit") : ""}
        z-[99] overflow-hidden modal top-0 left-0 absolute w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.25)]`}
				>
					<div
						onClick={(e) => {
							e.stopPropagation();
						}}
						className="w-1/2 xl:w-1/3 overflow-hidden flex flex-col gap-2 bg-white rounded-xl border border-slate-200 p-4"
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
								<span className={`${loading ? "opacity-0" : ""}`}>Save</span>
								{loading && <ButtonSpinner />}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default NotesModal;
