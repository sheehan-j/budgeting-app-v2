import PropTypes from "prop-types";
import { useAnimationStore } from "../util/animationStore";
import { useDataStore } from "../util/dataStore";
import { setTransactionIgnored, deleteTransaction } from "../util/supabaseQueries";
import { getDashboardStats } from "../util/statsUtil";
import { Link } from "react-router-dom";

const TransactionMenu = ({ transaction }) => {
	const { visibleTransactionMenu, animatingTransactionMenu, openTransactionMenu, closeTransactionMenu } =
		useAnimationStore((state) => ({
			visibleTransactionMenu: state.visibleTransactionMenu,
			animatingTransactionMenu: state.animatingTransactionMenu,
			openTransactionMenu: state.openTransactionMenu,
			closeTransactionMenu: state.closeTransactionMenu,
			openNotesModal: state.openNotesModal,
		}));
	const {
		transactions,
		setTransactions,
		filters,
		setDashboardStats,
		setNotification,
		setEditingMerchantSetting,
		setActiveSetting,
		setEditingNotesTransaction,
	} = useDataStore((state) => ({
		transactions: state.transactions,
		setTransactions: state.setTransactions,
		filters: state.filters,
		setDashboardStats: state.setDashboardStats,
		setNotification: state.setNotification,
		setEditingMerchantSetting: state.setEditingMerchantSetting,
		setActiveSetting: state.setActiveSetting,
		editingNotesTransaction: state.editingNotesTransaction,
		setEditingNotesTransaction: state.setEditingNotesTransaction,
	}));

	const toggleTransactionMenu = () => {
		if (visibleTransactionMenu === transaction.id) {
			closeTransactionMenu();
		} else {
			openTransactionMenu(transaction.id);
		}
	};

	const updateTransactionIgnored = async (ignore) => {
		toggleTransactionMenu();
		const success = await setTransactionIgnored(transaction.id, ignore);

		// Instead of calling fetchTransactions, which causes loading animations, just update the data in place on success
		if (success) {
			const newTransactions = transactions.map((t) => {
				if (t.id === transaction.id) {
					return { ...t, ignored: ignore };
				}
				return t;
			});
			setTransactions(newTransactions);
			setDashboardStats(await getDashboardStats(newTransactions, filters));
		} else {
			setNotification({ type: "error", message: "Could not ignore transaction." });
		}
	};

	const onClickDelete = async () => {
		toggleTransactionMenu();
		const success = await deleteTransaction(transaction.id);

		if (success) {
			const newTransactions = transactions.filter((transaction) => transaction.id !== transaction.id);
			setTransactions(newTransactions);
			setDashboardStats(await getDashboardStats(newTransactions, filters));
		} else {
			setNotification({ type: "error", message: "Could not delete transaction." });
		}
	};

	const onClickSaveMerchant = () => {
		const matchingTransaction = transactions.find((transaction) => transaction.id === transaction.id);
		if (matchingTransaction) {
			setEditingMerchantSetting({
				id: -1,
				category: { name: matchingTransaction.categoryName },
				text: matchingTransaction.merchant,
				type: "equals",
			});
			setActiveSetting("Merchants");
		}
	};

	const onClickNotes = () => {
		setEditingNotesTransaction(transaction);
	};

	return (
		<div className="transaction-menu w-full relative flex items-center justify-start">
			<div className="w-full max-w-4">
				<button onClick={toggleTransactionMenu} className="transaction-menu-button relative">
					<img src="./dots.svg" />
				</button>
			</div>
			{(visibleTransactionMenu === transaction.id || animatingTransactionMenu === transaction.id) && (
				<div
					className={`${
						animatingTransactionMenu === transaction.id
							? visibleTransactionMenu === transaction.id
								? "enter"
								: "exit"
							: ""
					} dropdown-down flex flex-col p-1 overflow-hidden w-[10rem] drop-shadow-sm absolute z-[99] right-0 top-[120%] bg-white border border-slate-200 rounded-lg`}
				>
					<Link to="/settings">
						<button
							onClick={() => onClickSaveMerchant()}
							className="transaction-menu-button w-full text-start font-normal text-xs hover:bg-slate-50 px-2 py-1 rounded flex items-center gap-1.5"
						>
							<img src="./save.svg" className="w-5" />
							Save Merchant
						</button>
					</Link>
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
