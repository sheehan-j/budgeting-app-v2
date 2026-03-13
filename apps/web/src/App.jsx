/* eslint-disable react-hooks/exhaustive-deps */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./screens/Dashboard";
import Spending from "./screens/Spending";
import Budgets from "./screens/Budgets";
import Settings from "./screens/Settings";

const App = () => {
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
