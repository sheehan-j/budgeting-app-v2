import TransactionTable from "../components/TransactionTable";
import Navbar from "../components/Navbar";
import { useDataStore } from "../util/dataStore";
import NotificationBanner from "../components/NotificationBanner";
import DashboardStats from "../components/DashboardStats";
import UploadModal from "../components/UploadModal";
import NotesModal from "../components/NotesModal";

const Dashboard = () => {
	const { transactions, setTransactions, transactionsLoading } = useDataStore((state) => ({
		transactions: state.transactions,
		setTransactions: state.setTransactions,
		transactionsLoading: state.transactionsLoading,
	}));

	return (
		<div className="w-screen h-screen flex overflow-hidden relative">
			<Navbar activePage={"Dashboard"} />
			<div className="grow flex flex-col gap-3 h-full overflow-y-auto no-scrollbar bg-slate-100 p-4 md:p-8 lg:p-8 xl:p-16 2xl:p-32">
				<DashboardStats />
				<TransactionTable
					transactions={transactions}
					setTransactions={setTransactions}
					transactionsLoading={transactionsLoading}
					linkToTransactionsPage={true}
				/>
			</div>
			<NotificationBanner />
			<UploadModal />
			<NotesModal />
		</div>
	);
};

export default Dashboard;
