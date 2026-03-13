/* eslint-disable react-hooks/exhaustive-deps */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDataStore } from "./util/dataStore";
import { useAnimationStore } from "./util/animationStore";
import Dashboard from "./screens/Dashboard";
import Spending from "./screens/Spending";
import Budgets from "./screens/Budgets";
import Settings from "./screens/Settings";
import Login from "./screens/Login";

const App = () => {
	const { session, setSession } = useDataStore((state) => ({
		session: state.session,
		setSession: state.setSession,
	}));
	const {
		filterMenuVisible,
		closeFilterMenu,
		visibleCategoryMenu,
		closeCategoryMenu,
		visibleTransactionMenu,
		closeTransactionMenu,
		bulkActionsMenuVisible,
		closeBulkActionsMenu,
	} = useAnimationStore((state) => ({
		filterMenuVisible: state.filterMenuVisible,
		closeFilterMenu: state.closeFilterMenu,
		visibleCategoryMenu: state.visibleCategoryMenu,
		closeCategoryMenu: state.closeCategoryMenu,
		visibleTransactionMenu: state.visibleTransactionMenu,
		closeTransactionMenu: state.closeTransactionMenu,
		bulkActionsMenuVisible: state.bulkActionsMenuVisible,
		closeBulkActionsMenu: state.closeBulkActionsMenu,
	}));
	// const [loading, setLoading] = useState(true);

	// const loadData = async () => {
	// 	const images = {
	// 		dashboardGreen: "./dashboard_green.svg",
	// 		dashboardSlate: "./dashboard_slate.svg",
	// 		transactionsGreen: "./transactions_green.svg",
	// 		transactionsSlate: "./transactions_slate.svg",
	// 		settingsGreen: "./settings_green.svg",
	// 		settingsSlate: "./settings_slate.svg",
	// 	};

	// 	// eslint-disable-next-line no-unused-vars
	// 	Object.entries(images).map(async ([key, value]) => {
	// 		const img = new Image();
	// 		img.src = value;
	// 	});
	// };

	window.onclick = (event) => {
		const categoryMenuClassNames = [".category-button", ".category-menu"];
		if (
			!categoryMenuClassNames.some((className) => event.target.closest(className)) &&
			visibleCategoryMenu !== null
		) {
			closeCategoryMenu();
		}

		const addFilterMenuClassNames = [
			".add-filter-button",
			".add-filter-menu",
			".add-filter-option",
			".add-filter-header",
		];
		if (!addFilterMenuClassNames.some((className) => event.target.closest(className)) && filterMenuVisible) {
			closeFilterMenu();
		}

		const transactionMenuClassNames = [".transaction-menu-button", ".transaction-menu"];
		if (
			!transactionMenuClassNames.some((className) => event.target.closest(className)) &&
			visibleTransactionMenu !== null
		) {
			closeTransactionMenu();
		}

		const bulkActionsMenuClassNames = [".bulk-actions-menu", ".bulk-actions-button"];
		if (!bulkActionsMenuClassNames.some((className) => event.target.closest(className)) && bulkActionsMenuVisible) {
			closeBulkActionsMenu();
		}
	};

  // TODO: Add back later
	// if (loading) return null;

	return (
		<BrowserRouter>
			<Routes>
        <Route path="/*" element={<Dashboard />} />
        <Route path="/spending" element={<Spending />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/budgets" element={<Budgets />} />
				{/* {session ? (
					<>
						<Route path="/*" element={<Dashboard />} />
						<Route path="/spending" element={<Spending />} />
						<Route path="/settings" element={<Settings />} />
						<Route path="/budgets" element={<Budgets />} />
					</>
				) : (
					<>
						<Route path="/*" element={<Login />} />
					</>
				)} */}
			</Routes>
		</BrowserRouter>
	);
};

export default App;