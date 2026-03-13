import PropTypes from "prop-types";
import { useRef } from "react";
import { useDataStore } from "../../util/dataStore";
import { useUpdateTransactionsIgnoredMutation } from "../../mutations/useUpdateTransactionsIgnoredMutation";
import { useDeleteTransactionsMutation } from "../../mutations/useDeleteTransactionsMutation";
import { useAnimatedPresence } from "../../util/useAnimatedPresence";
import { useClickOutside } from "../../util/useClickOutside";
import { useNavigate } from "react-router-dom";

const TransactionMenu = ({ transaction }) => {
	const { setEditingMerchantSetting, setScrollToNewMerchantSetting, setActiveSetting, setEditingNotesTransaction } = useDataStore((state) => ({
		setEditingMerchantSetting: state.setEditingMerchantSetting,
    setScrollToNewMerchantSetting: state.setScrollToNewMerchantSetting,
		setActiveSetting: state.setActiveSetting,
		setEditingNotesTransaction: state.setEditingNotesTransaction,
	}));
	const menuRef = useRef(null);
	const navigate = useNavigate();
	const { isMounted, animationClass, close, closeAndWait, toggle, onAnimationEnd } = useAnimatedPresence();

	useClickOutside(menuRef, close, isMounted);

	const updateTransactionsIgnoredMutation = useUpdateTransactionsIgnoredMutation();
	const deleteTransactionsMutation = useDeleteTransactionsMutation();

	const updateTransactionIgnored = async (ignore) => {
		await closeAndWait();

		updateTransactionsIgnoredMutation.mutate({
			transactionIds: [transaction.id],
			ignored: ignore,
		});
	};

	const onClickDelete = async () => {
		await closeAndWait();

		deleteTransactionsMutation.mutate([transaction.id]);
	};

	const onClickSaveMerchant = async () => {
		await closeAndWait();
		setEditingMerchantSetting({
			id: -1,
			category: { name: transaction.categoryName },
			text: transaction.merchant,
			type: "equals",
		});
    setScrollToNewMerchantSetting(true);
		setActiveSetting("Merchants");
		navigate("/settings");
	};

	const onClickNotes = async () => {
		await closeAndWait();
		setEditingNotesTransaction(transaction);
	};

	return (
		<div ref={menuRef} className="transaction-menu w-full relative flex items-center justify-start">
			<div className="w-full max-w-4">
				<button onClick={toggle} className="transaction-menu-button relative">
					<img src="./dots.svg" />
				</button>
			</div>
			{isMounted && (
				<div
					onAnimationEnd={onAnimationEnd}
					className={`${animationClass} dropdown-down flex flex-col p-1 overflow-hidden w-[10rem] drop-shadow-sm absolute z-[99] right-0 top-[120%] bg-white border border-slate-200 rounded-lg`}
				>
					<button
						onClick={onClickSaveMerchant}
						className="transaction-menu-button w-full text-start font-normal text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
					>
						<img src="./save.svg" className="w-5" />
						Save Merchant
					</button>
					<button
						onClick={onClickNotes}
						className="transaction-menu-button w-full text-start font-normal text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
					>
						<div className="w-5 px-0.5">
							<img src="./notes_slate.svg" className="w-full" />
						</div>
						Notes
					</button>
					{transaction.ignored ? (
						<button
							onClick={() => {
								updateTransactionIgnored(false);
							}}
							className="transaction-menu-button text-start font-normal text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
						>
							<img src="./unignore.svg" className="w-5" />
							Un-ignore
						</button>
					) : (
						<button
							onClick={() => {
								updateTransactionIgnored(true);
							}}
							className="transaction-menu-button text-start font-normal text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
						>
							<img src="./ignore.svg" className="transaction-menu-item w-5" />
							Ignore
						</button>
					)}
					<button
						onClick={onClickDelete}
						className="transaction-menu-button text-start font-normal text-xs text-red-400 hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
					>
						<img src="./trash.svg" className="transaction-menu-item w-5" />
						Delete
					</button>
				</div>
			)}
		</div>
	);
};

TransactionMenu.propTypes = {
	transaction: PropTypes.object,
};

export default TransactionMenu;
