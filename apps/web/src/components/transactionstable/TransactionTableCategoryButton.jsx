import { useUpdateTransactionsCategoryMutation } from "../../mutations/useUpdateTransactionsCategoryMutation";
import { useAnimationStore } from "../../util/animationStore";
import ButtonSpinner from "../common/ButtonSpinner";
import PropTypes from "prop-types";

const TransactionTableCategoryButton = ({ transaction, categories, categoriesLoading, tableRef }) => {
	const { visibleCategoryMenu, animatingCategoryMenu, menuDirectionDown, openCategoryMenu, closeCategoryMenu } =
		useAnimationStore((state) => ({
			visibleCategoryMenu: state.visibleCategoryMenu,
			animatingCategoryMenu: state.animatingCategoryMenu,
			menuDirectionDown: state.categoryMenuDirectionDown,
			openCategoryMenu: state.openCategoryMenu,
			closeCategoryMenu: state.closeCategoryMenu,
		}));

	const updateTransactionsCategoryMutation = useUpdateTransactionsCategoryMutation();

	const onClickCategory = async (categoryName) => {
		if (updateTransactionsCategoryMutation.isPending) return;

		await closeCategoryMenu();

		updateTransactionsCategoryMutation.mutate({
			transactionIds: [transaction.id],
			categoryName,
		});
	};

	return (
		<>
			{!categoriesLoading && (
				<>
					<button
						ref={(ref) => {
							transaction.buttonRef = ref;
						}}
						onClick={
							transaction.ignored
								? () => {} // If the transaction is ignored, do nothing
								: visibleCategoryMenu === transaction.id
									? closeCategoryMenu
									: () => openCategoryMenu(transaction.id, transaction.buttonRef, tableRef)
						}
						className={`${
							transaction.ignored ? "hover:cursor-default" : ""
						} category-button inline-block bg-red-100 px-1.5 py-0.5 border border-red-200 rounded`}
						// Apply color styles set inside the DB
						style={{
							backgroundColor:
								categories?.find((category) => category.name === transaction.categoryName)?.color ||
								"white",
							borderWidth: "1px",
							borderColor:
								categories?.find((category) => category.name === transaction.categoryName)?.colorDark ||
								"white",
						}}
					>
						{transaction.categoryName}
					</button>
					{/** Checks if this menu is either currently visible or being animated to be visible/invisible */}
					{(visibleCategoryMenu === transaction.id || animatingCategoryMenu === transaction.id) && (
						<div
							className={`${
								animatingCategoryMenu === transaction.id // First checks if this menu is being animated
									? visibleCategoryMenu === transaction.id // If it is, then check if it should become visible or invisible
										? "enter"
										: "exit"
									: ""
							} ${
								// Check if the menu should be below or above the button, based on available space
								menuDirectionDown ? "dropdown-down top-[130%]" : "dropdown-up bottom-[130%]"
							} absolute bg-white border border-slate-300 rounded-lg drop-shadow-sm z-10 px-2 py-1.5`}
						>
							<div className="font-semibold text-slate-600 mb-1">Edit Category</div>
							{/** Map each category to be displayed in the dropdown menu */}
							<div
								className={`${updateTransactionsCategoryMutation.isPending ? "opacity-0" : ""} flex flex-col gap-1 relative`}
							>
								{!categoriesLoading &&
									categories.map((category) => (
										<button
											key={category.name}
											className="category-button text-sm text-slate-600 px-3 py-0.5 rounded"
											style={{
												backgroundColor: category.color,
												borderWidth: "1px",
												borderColor: category.colorDark,
											}}
											onClick={() => onClickCategory(category.name)}
										>
											{category.name}
										</button>
									))}
							</div>
							{updateTransactionsCategoryMutation.isPending && <ButtonSpinner />}
						</div>
					)}
				</>
			)}
		</>
	);
};

TransactionTableCategoryButton.propTypes = {
	transaction: PropTypes.object,
	tableRef: PropTypes.object,
	categories: PropTypes.array,
	categoriesLoading: PropTypes.bool,
};

export default TransactionTableCategoryButton;
