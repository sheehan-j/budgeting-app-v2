import { useEffect, useMemo, useState } from "react";
import { useAnimatedPresence } from "../../../util/useAnimatedPresence";
import { useSaveCategoryMutation } from "../../../mutations/useSaveCategoryMutation";
import { useDeleteCategoryMutation } from "../../../mutations/useDeleteCategoryMutation";
import { useDataStore } from "../../../util/dataStore";
import PropTypes from "prop-types";
import ButtonSpinner from "../../common/ButtonSpinner";

const EditCategoryModal = ({ editingCategory, setEditingCategory, categories, colors }) => {
	const safeCategories = Array.isArray(categories) ? categories : [];
	const [name, setName] = useState("");
	const [selectedColorName, setSelectedColorName] = useState("");
	const [originalColorName, setOriginalColorName] = useState("");
	const [originalCategoryName, setOriginalCategoryName] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState(false);
	const [createMode, setCreateMode] = useState(false);

	const { isMounted, animationClass, open, close, onAnimationEnd, closeAndWait } = useAnimatedPresence();
	const { setNotification } = useDataStore((state) => ({
		setNotification: state.setNotification,
	}));

	const saveCategoryMutation = useSaveCategoryMutation();
	const deleteCategoryMutation = useDeleteCategoryMutation();

	const safeColors = useMemo(() => {
		return colors && typeof colors === "object" && !Array.isArray(colors) ? colors : {};
	}, [colors]);
	const colorOptions = useMemo(() => {
		return Object.entries(safeColors).sort(([, a], [, b]) => a.position - b.position);
	}, [safeColors]);
	const selectedColor = selectedColorName ? safeColors[selectedColorName] : null;
	const conflictingCategory = selectedColorName
		? safeCategories.find(
				(category) => category.id !== (editingCategory?.id ?? "") && category.colorName === selectedColorName,
			)
		: null;
	const isSaveDisabled =
		!name.trim() ||
		!selectedColorName ||
		submitting ||
		(originalColorName === selectedColorName && originalCategoryName === name);

	useEffect(() => {
		if (!editingCategory) return;

		setCreateMode(!editingCategory?.id);
		setName(editingCategory.name ?? "");
		setOriginalCategoryName(
			editingCategory?.colorName ??
				colorOptions.find(([, colorOption]) => colorOption.color === editingCategory?.color)?.[0] ??
				"",
		);

		const originalColorName =
			editingCategory?.colorName ??
			colorOptions.find(([, colorOption]) => colorOption.color === editingCategory?.color)?.[0] ??
			colorOptions?.[categories.length][0] ??
			"";
		setOriginalColorName(originalColorName);
		setSelectedColorName(originalColorName);
		open();
	}, [editingCategory, colorOptions, open, categories]);

	const resetState = () => {
		setSubmitting(false);
		setEditingCategory(null);
		setDeleteConfirm(false);
	};

	const closeModal = () => {
		setOriginalCategoryName(null);
		setOriginalCategoryName(null);
		setEditingCategory(null);
		close();
	};

	const saveCategory = async () => {
		if (!editingCategory || isSaveDisabled) return;
		setSubmitting(true);
		await closeAndWait();

		saveCategoryMutation.mutate(
			{
				id: editingCategory?.id ?? undefined,
				name: name.trim(),
				color: selectedColorName,
			},
			{
				onSuccess: () => {
					resetState();
					setNotification({ type: "success", message: "Category successfully updated." });
				},
				onError: () => {
					resetState();
				},
			},
		);
	};

	const deleteCategory = async () => {
		if (!editingCategory || isSaveDisabled) return;
		setSubmitting(true);
		await closeAndWait();

		deleteCategoryMutation.mutate(editingCategory.id, {
			onSuccess: () => {
				resetState();
				setNotification({ type: "success", message: "Category successfully deleted." });
			},
			onError: () => {
				resetState();
			},
		});
	};

	const handleAnimationEnd = (event) => {
		if (event.target !== event.currentTarget) return;

		const isClosing = animationClass === "exit";
		onAnimationEnd(event);

		if (isClosing) {
			setName("");
			setSelectedColorName("");
			setEditingCategory(null);
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
						className={`${animationClass} modal-panel w-11/12 max-w-[520px] overflow-hidden flex flex-col gap-3 bg-white rounded-xl border border-slate-200 p-4`}
					>
						<div className="text-base text-slate-600 font-semibold">
							{createMode ? "Create" : deleteConfirm ? "Delete" : "Edit"} Category
						</div>
						{!deleteConfirm ? (
							<>
								<div className="flex flex-col gap-0.5">
									<label className="text-sm text-slate-500" htmlFor="edit-category-name">
										Name
									</label>
									<input
										id="edit-category-name"
										className="outline-none text-sm p-1.5 border border-slate-200 rounded"
										placeholder="Category name"
										value={name}
										maxLength="40"
										onChange={(e) => setName(e.target.value)}
									/>
								</div>
								<div className="flex flex-col gap-0.5">
									<label className="text-sm text-slate-500" htmlFor="edit-category-color">
										Color
									</label>
									<select
										id="edit-category-color"
										className="border border-slate-200 text-sm rounded outline-none p-1.5 bg-white"
										value={selectedColorName}
										onChange={(e) => setSelectedColorName(e.target.value)}
									>
										<option value="" disabled>
											Select a color
										</option>
										{colorOptions.map(([colorName]) => (
											<option key={colorName} value={colorName}>
												{colorName}
											</option>
										))}
									</select>
								</div>
								{selectedColor && (
									<div className="flex items-center gap-2">
										<span className="text-sm text-slate-500">Preview</span>
										<span
											className="inline-block py-1 px-2 rounded-md text-sm text-slate-700"
											style={{
												backgroundColor: selectedColor.color,
												outline: `1px solid ${selectedColor.colorDark}`,
											}}
										>
											{name.trim() || "Category Preview"}
										</span>
									</div>
								)}
								{conflictingCategory && originalColorName && (
									<div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
										The existing category {`"${conflictingCategory.name}"`} uses the color{" "}
										{selectedColorName} and will be reassigned to {originalColorName} if you{" "}
										{createMode ? "create" : "save"}.
									</div>
								)}
								<div className="flex justify-between border-t border-slate-300 gap-2 pt-3 mt-2">
									<button
										onClick={() => setDeleteConfirm(true)}
										className="relative bg-red-100 hover:bg-red-200 py-1 px-2 border border-slate-300 rounded text-sm text-slate-700"
									>
										Delete
									</button>
									<div className="flex gap-2">
										<button
											onClick={closeModal}
											disabled={submitting}
											className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded disabled:opacity-60 disabled:cursor-not-allowed"
										>
											Cancel
										</button>
										<button
											className="relative bg-cGreen-light hover:bc-cGreen-lightHover py-1 px-2 border border-slate-300 rounded text-sm text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
											onClick={saveCategory}
											disabled={isSaveDisabled}
										>
											<span className={`${submitting ? "opacity-0" : ""}`}>
												{createMode ? "Create" : "Save"}
											</span>
											{submitting && <ButtonSpinner />}
										</button>
									</div>
								</div>
							</>
						) : (
							<>
								<div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
									<span className="font-semibold text-amber-700">Warning: </span>Any transactions
									currently categorized as {editingCategory.name} will be updated to Uncategorized.
									Are you sure you want to proceed?
								</div>
								<div className="flex justify-between border-t border-slate-300 gap-2 pt-3 mt-2">
									<button
										onClick={() => setDeleteConfirm(false)}
										className="relative hover:bg-gray-50 200 py-1 px-2 border border-slate-300 rounded text-sm text-slate-700"
									>
										Cancel
									</button>
									<button
										className="relative bg-cGreen-light hover:bc-cGreen-lightHover py-1 px-2 border border-slate-300 rounded text-sm text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
										onClick={deleteCategory}
									>
										<span className={`${submitting ? "opacity-0" : ""}`}>Confirm</span>
										{submitting && <ButtonSpinner />}
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}
		</>
	);
};

EditCategoryModal.propTypes = {
	editingCategory: PropTypes.object,
	setEditingCategory: PropTypes.func.isRequired,
	categories: PropTypes.array,
	colors: PropTypes.object,
	onSave: PropTypes.func,
};

export default EditCategoryModal;
