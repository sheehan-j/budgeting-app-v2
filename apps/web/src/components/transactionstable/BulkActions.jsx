import { useEffect, useRef, useState } from "react";
import { useDataStore } from "../../util/dataStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList } from "@fortawesome/free-solid-svg-icons";
import { useUpdateTransactionsCategoryMutation } from "../../mutations/useUpdateTransactionsCategoryMutation";
import { useUpdateTransactionsIgnoredMutation } from "../../mutations/useUpdateTransactionsIgnoredMutation";
import { useDeleteTransactionsMutation } from "../../mutations/useDeleteTransactionsMutation";
import { useAnimatedPresence } from "../../util/useAnimatedPresence";
import { useClickOutside } from "../../util/useClickOutside";

import PropTypes from "prop-types";

const BulkActions = ({ categories, selectedTransactionIds, setSelectedTransactionIds }) => {
	const { setNotification } = useDataStore((state) => ({
		setNotification: state.setNotification,
	}));
	const [slideMenu, setSlideMenu] = useState(false);
	const menuRef = useRef(null);
	const { isOpen, isMounted, animationClass, close, closeAndWait, toggle, onAnimationEnd } = useAnimatedPresence();

	useClickOutside(menuRef, close, isMounted);

	useEffect(() => {
		if (!isOpen) setSlideMenu(false);
	}, [isOpen]);

	const updateTransactionsCategoryMutation = useUpdateTransactionsCategoryMutation();
	const updateTransactionsIgnoredMutation = useUpdateTransactionsIgnoredMutation();
	const deleteTransactionsMutation = useDeleteTransactionsMutation();

	const onClickCategory = async (categoryId) => {
		if (updateTransactionsCategoryMutation.isPending) return;

		await closeAndWait();

		updateTransactionsCategoryMutation.mutate(
			{
				transactionIds: selectedTransactionIds,
				categoryId,
			},
			{
				onError: () => {
					setNotification({
						type: "error",
						message: `Could not update transaction${selectedTransactionIds.length > 1 ? "s" : ""}.`,
					});
				},
			},
		);
	};

	const onUpdateIgnored = async (ignored) => {
		if (updateTransactionsIgnoredMutation.isPending) return;

		await closeAndWait();

		updateTransactionsIgnoredMutation.mutate(
			{
				transactionIds: selectedTransactionIds,
				ignored,
			},
			{
				onError: () => {
					setNotification({
						type: "error",
						message: `Could not update transaction${selectedTransactionIds.length > 1 ? "s" : ""}.`,
					});
				},
			},
		);
	};

	const onDelete = async () => {
		if (deleteTransactionsMutation.isPending) return;

		await closeAndWait();

		deleteTransactionsMutation.mutate(selectedTransactionIds, {
			onSuccess: () => {
				setSelectedTransactionIds([]);
			},
			onError: () => {
				setNotification({
					type: "error",
					message: `Could not update transaction${selectedTransactionIds.length > 1 ? "s" : ""}.`,
				});
			},
		});
	};

	return (
		<div ref={menuRef} className="bulk-actions-menu w-full relative flex items-center justify-start">
			<div className=" w-full">
				<button
					onClick={toggle}
					className=" relative font-normal text-slate-600 bg-cGreen-lighter hover:bg-cGreen-lightHover border border-slate-300 rounded text-sm py-1 px-2"
				>
					Bulk Actions
				</button>
			</div>
			{isMounted && (
				<div
					onAnimationEnd={onAnimationEnd}
					className={`${animationClass} dropdown-down flex flex-col overflow-hidden w-[12rem] drop-shadow-sm absolute z-[99] left-0 top-[120%] bg-white border border-slate-200 rounded-lg`}
				>
					<div
						className="flex w-[200%] transition-[transform] duration-200"
						style={{ transform: slideMenu ? "translateX(-50%)" : "" }}
					>
						<div className="w-1/2 px-1 py-1.5">
							<button
								onClick={() => setSlideMenu(true)}
								className=" w-full text-start font-regular text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
							>
								<div className=" w-5 flex justify-center items-center">
									<FontAwesomeIcon className="" size="lg" icon={faList} />
								</div>
								Categorize Selected
							</button>
							<button
								onClick={() => onUpdateIgnored(true)}
								className=" w-full text-start font-regular text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
							>
								<img src="./ignore.svg" className=" transaction-menu-item w-5" />
								Ignore Selected
							</button>
							<button
								onClick={() => onUpdateIgnored(false)}
								className=" w-full text-start font-regular text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
							>
								<img src="./unignore.svg" className=" transaction-menu-item w-5" />
								Un-ignore Selected
							</button>
							<button
								onClick={onDelete}
								className=" w-full text-start font-regular text-xs text-red-400 hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
							>
								<img src="./trash.svg" className=" transaction-menu-item w-5" />
								Delete Selected
							</button>
						</div>
						<div className=" w-1/2">
							{slideMenu && (
								<div className=" flex flex-col gap-1 px-2 py-1.5">
									<button
										onClick={() => setSlideMenu(false)}
										className="w-4 hover:bg-slate-50 rounded"
									>
										<img src="./back.svg" className=" w-full" />
									</button>
									{categories.map((category) => (
										<button
											key={category.name}
											className=" w-full text-xs text-slate-600 px-1 py-0.5 rounded"
											style={{
												backgroundColor: category.color,
												borderWidth: "1px",
												borderColor: category.colorDark,
											}}
											onClick={() => {
												onClickCategory(category.id);
											}}
										>
											{category.name}
										</button>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

BulkActions.propTypes = {
	categories: PropTypes.array,
	selectedTransactionIds: PropTypes.array,
	setSelectedTransactionIds: PropTypes.func,
};

export default BulkActions;
