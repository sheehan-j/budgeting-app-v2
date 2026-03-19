import { useRef, useState } from "react";
import { useUpdateTransactionsCategoryMutation } from "../../mutations/useUpdateTransactionsCategoryMutation";
import { useAnimatedPresence } from "../../util/useAnimatedPresence";
import { useClickOutside } from "../../util/useClickOutside";
import ButtonSpinner from "../common/ButtonSpinner";
import PropTypes from "prop-types";

const TransactionTableCategoryButton = ({ transaction, categories, categoriesLoading, tableRef }) => {
	const updateTransactionsCategoryMutation = useUpdateTransactionsCategoryMutation();
	const containerRef = useRef(null);
	const buttonRef = useRef(null);
	const [menuDirectionDown, setMenuDirectionDown] = useState(true);
	const { isOpen, isMounted, animationClass, open, close, closeAndWait, onAnimationEnd } = useAnimatedPresence();

	useClickOutside(containerRef, close, isMounted);

	const openMenu = () => {
		if (!buttonRef.current || !tableRef.current) {
			open();
			return;
		}

		const buttonRect = buttonRef.current.getBoundingClientRect();
		const tableRect = tableRef.current.getBoundingClientRect();
		const spaceBelow = tableRect.bottom - buttonRect.bottom;
		const spaceAbove = buttonRect.top - tableRect.top;

		setMenuDirectionDown(!(spaceBelow < 450 && spaceAbove > spaceBelow));
		open();
	};

	const onClickCategory = async (categoryId) => {
		if (updateTransactionsCategoryMutation.isPending) return;

		await closeAndWait();

		updateTransactionsCategoryMutation.mutate({
			transactionIds: [transaction.id],
			categoryId,
		});
	};

	return (
		<>
			{!categoriesLoading && (
				<div ref={containerRef} className="relative inline-block">
					<button
						ref={buttonRef}
						onClick={
							transaction.ignored
								? () => {} // If the transaction is ignored, do nothing
								: isOpen
									? close
									: openMenu
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
					{isMounted && (
						<div
							onAnimationEnd={onAnimationEnd}
							className={`${animationClass} ${
								menuDirectionDown ? "dropdown-down top-[130%]" : "dropdown-up bottom-[130%]"
							} category-menu absolute bg-white border border-slate-300 rounded-lg drop-shadow-sm z-10 px-2 py-1.5`}
						>
							<div className="font-semibold text-slate-600 mb-1">Edit Category</div>
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
											onClick={() => onClickCategory(category.id)}
										>
											{category.name}
										</button>
									))}
							</div>
							{updateTransactionsCategoryMutation.isPending && <ButtonSpinner />}
						</div>
					)}
				</div>
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
