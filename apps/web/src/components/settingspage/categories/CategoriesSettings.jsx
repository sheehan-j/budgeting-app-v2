import { useState, useEffect } from "react";
import { Fragment } from "react/jsx-runtime";
import { useCategoriesQuery } from "../../../queries/useCategoriesQuery";
import { useColorsQuery } from "../../../queries/useColorsQuery";
import { nonCustomizableCategories } from "../../../constants/Categories";
import ButtonSpinner from "../../common/ButtonSpinner";
import EditCategoryModal from "./EditCategoryModal";
import RecategorizeTransactionsModal from "./RecategorizeTransactionsModal";

const CategoriesSettings = () => {
	const { data: categories, isLoading: categoriesLoading, isFetching: categoriesFetching } = useCategoriesQuery();
	const { data: colors, isLoading: colorsLoading, isFetching: colorsFetching } = useColorsQuery();
	const [currentCategories, setCurrentCategories] = useState([]);
	const [editingCategory, setEditingCategory] = useState(null);
	const [isRecategorizeModalOpen, setIsRecategorizeModalOpen] = useState(false);

	const loading = categoriesLoading || categoriesFetching || colorsLoading || colorsFetching;
	const categoryLimitReached = currentCategories.length === Object.keys(colors).length;

	const tableCellStyles = "px-3 py-2 flex justify-start items-center";
	const sortedCategories = [...currentCategories].sort((a, b) => a.position - b.position);

	useEffect(() => {
		if (categories && !categoriesLoading && !categoriesFetching) {
			setCurrentCategories(categories.filter((category) => !nonCustomizableCategories.includes(category.name)));
		}
	}, [categories, categoriesFetching, categoriesLoading]);

	return (
		<div className="grow flex flex-col justify-center items-center">
			<div className="grow w-full flex flex-col overflow-y-hidden">
				<div className="overflow-y-auto grow p-6">
					<div className="text-lg text-slate-600 font-semibold mb-3">Categories</div>

					{!loading ? (
						<>
							{/* CATEGORIES TABLE */}
							<div className="flex rounded-lg overflow-hidden">
								{/* CATEGORIES TABLE COLUMNS */}
								<div className="grow flex flex-col shrink-0">
									<div className={`${tableCellStyles} py-3 bg-gray-50 font-semibold`}>Name</div>
									{sortedCategories.map((category, index) => (
										<Fragment key={"name-" + category.id}>
											<div className="min-h-[1px] bg-slate-300"></div>
											<div className={`${tableCellStyles} ${index % 2 == 0 ? "" : "bg-gray-50"}`}>
												<span
													className="inline-block relative text-sm font-normal py-1 px-2 rounded-md"
													style={{
														backgroundColor: category.color,
														border: `1px solid ${category.colorDark}`,
													}}
												>
													{category.name}
												</span>
											</div>
										</Fragment>
									))}
									<div className="min-h-[1px] bg-slate-300"></div>
									<div className="min-h-[30px] bg-gray-50"></div>
								</div>
								<div className="flex flex-col w-[15%]">
									<div className={`${tableCellStyles} py-3 bg-gray-50 font-semibold`}>
										<span className="opacity-0">Edit</span>
									</div>
									{sortedCategories.map((category, index) => (
										<Fragment key={"color-" + category.id}>
											<div className="min-h-[1px] bg-slate-300"></div>
											<div className={`${tableCellStyles} ${index % 2 == 0 ? "" : "bg-gray-50"}`}>
												<button
													onClick={() => setEditingCategory(category)}
													className="border-slate-200 relative text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded"
												>
													Edit
												</button>
											</div>
										</Fragment>
									))}
									<div className="min-h-[1px] bg-slate-300"></div>
									<div className="min-h-[30px] bg-gray-50"></div>
								</div>
							</div>
						</>
					) : (
						<div className="grow w-full flex justify-center items-center">
							<div className="relative">
								<ButtonSpinner />
							</div>
						</div>
					)}
				</div>
				<div className="border-t border-slate-300 w-full flex justify-between items-start px-6 py-4">
					<button
						onClick={() => setIsRecategorizeModalOpen(true)}
						disabled={loading || currentCategories.length < 2}
						className="border-slate-200 relative text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded"
					>
						<span>Recategorize Transactions</span>
					</button>
					<div className="flex flex-col items-end gap-2">
						<button
							disabled={categoryLimitReached}
							className="relative bg-blue-100 py-1 px-2 bg-cGreen-light hover:bg-cGreen-lightHover border border-slate-300 rounded text-sm text-slate-700 p-1 disabled:opacity-60 disabled:hover:bg-cGreen-light"
							onClick={() => setEditingCategory({})} // Set to non-null empty object to triger modal
						>
							Create
						</button>
						{categoryLimitReached && (
							<div className="text-xs">Maximum number of categories have been created.</div>
						)}
					</div>
				</div>
			</div>
			<EditCategoryModal
				editingCategory={editingCategory}
				setEditingCategory={setEditingCategory}
				categories={currentCategories}
				colors={colors}
			/>
			<RecategorizeTransactionsModal
				isOpen={isRecategorizeModalOpen}
				setIsOpen={setIsRecategorizeModalOpen}
				categories={currentCategories}
			/>
		</div>
	);
};

export default CategoriesSettings;
