import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useAnimatedPresence } from "../../../util/useAnimatedPresence";
import { useRecategorizeTransactionsMutation } from "../../../mutations/useRecategorizeTransactionsMutation";
import { useDataStore } from "../../../util/dataStore";
import ButtonSpinner from "../../common/ButtonSpinner";

const RecategorizeTransactionsModal = ({ isOpen, setIsOpen, categories }) => {
	const [currentCategoryId, setCurrentCategoryId] = useState("");
	const [targetCategoryId, setTargetCategoryId] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const { isMounted, animationClass, open, close, onAnimationEnd, closeAndWait } = useAnimatedPresence();
	const { setNotification } = useDataStore((state) => ({
		setNotification: state.setNotification,
	}));

	const recategorizeTransactionsMutation = useRecategorizeTransactionsMutation();

	const sortedCategories = useMemo(() => {
		const safeCategories = Array.isArray(categories) ? categories : [];
		return [...safeCategories].sort((a, b) => a.position - b.position);
	}, [categories]);

	const targetOptions = useMemo(() => {
		return sortedCategories.filter((category) => String(category.id) !== currentCategoryId);
	}, [currentCategoryId, sortedCategories]);

	const isSubmitDisabled =
		!currentCategoryId || !targetCategoryId || currentCategoryId === targetCategoryId || submitting;

	useEffect(() => {
		if (!isOpen) return;

		setCurrentCategoryId("");
		setTargetCategoryId("");
		open();
	}, [isOpen, open]);

	useEffect(() => {
		if (targetCategoryId && targetOptions.every((category) => String(category.id) !== targetCategoryId)) {
			setTargetCategoryId("");
		}
	}, [targetCategoryId, targetOptions]);

	const resetState = () => {
		setSubmitting(false);
		setCurrentCategoryId("");
		setTargetCategoryId("");
		setIsOpen(false);
	};

	const closeModal = () => {
		setIsOpen(false);
		close();
	};

	const recategorize = async () => {
		if (isSubmitDisabled) return;
		setSubmitting(true);
		await closeAndWait();

		recategorizeTransactionsMutation.mutate(
			{
				initialCategoryId: Number(currentCategoryId),
				targetCategoryId: Number(targetCategoryId),
			},
			{
				onSuccess: (updatedCount) => {
					resetState();
					setNotification({
						type: "success",
						message: `${updatedCount} transaction${updatedCount === 1 ? "" : "s"} recategorized.`,
					});
				},
				onError: () => {
					resetState();
				},
			},
		);
	};

	const handleAnimationEnd = (event) => {
		if (event.target !== event.currentTarget) return;

		const isClosing = animationClass === "exit";
		onAnimationEnd(event);

		if (isClosing) {
			setCurrentCategoryId("");
			setTargetCategoryId("");
		}
	};

	return (
		<>
			{isMounted && (
				<div
					onAnimationEnd={handleAnimationEnd}
					onClick={submitting ? undefined : closeModal}
					className={`${animationClass}
        z-[99] overflow-hidden modal-backdrop top-0 left-0 absolute w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.25)]`}
				>
					<div
						onClick={(e) => {
							e.stopPropagation();
						}}
						className={`${animationClass} modal-panel w-11/12 max-w-[520px] overflow-hidden flex flex-col gap-4 bg-white rounded-xl border border-slate-200 p-4`}
					>
						<div>
							<div className="text-base text-slate-600 font-semibold">Recategorize Transactions</div>
							<div className="text-[0.8rem] text-slate-500">
								Move all transactions from one category to another existing category
							</div>
						</div>
						<div className="flex flex-col gap-0.5">
							<label className="text-sm text-slate-500" htmlFor="current-category-id">
								Current category
							</label>
							<select
								id="current-category-id"
								className="border border-slate-200 text-sm rounded outline-none p-1 bg-white"
								value={currentCategoryId}
								onChange={(e) => setCurrentCategoryId(e.target.value)}
							>
								<option value="" disabled>
									Select a category
								</option>
								{sortedCategories.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex flex-col gap-0.5">
							<label className="text-sm text-slate-500">Target category</label>
							<select
								id="target-category-id"
								className="border border-slate-200 text-sm rounded outline-none p-1 bg-white"
								value={targetCategoryId}
								onChange={(e) => setTargetCategoryId(e.target.value)}
								disabled={!currentCategoryId}
							>
								<option value="" disabled>
									Select a category
								</option>
								{targetOptions.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<button
								onClick={closeModal}
								disabled={submitting}
								className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded disabled:opacity-60 disabled:cursor-not-allowed"
							>
								Cancel
							</button>
							<button
								className="relative bg-cGreen-light hover:bg-cGreen-lightHover py-1 px-2 border border-slate-300 rounded text-sm text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
								onClick={recategorize}
								disabled={isSubmitDisabled}
							>
								<span className={`${submitting ? "opacity-0" : ""}`}>Recategorize</span>
								{submitting && <ButtonSpinner />}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

RecategorizeTransactionsModal.propTypes = {
	isOpen: PropTypes.bool,
	setIsOpen: PropTypes.func.isRequired,
	categories: PropTypes.array,
};

export default RecategorizeTransactionsModal;
