/* eslint-disable react-hooks/exhaustive-deps */
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { authClient } from "./lib/authClient";
import Dashboard from "./screens/Dashboard";
import Spending from "./screens/Spending";
import Budgets from "./screens/Budgets";
import Login from "./screens/Login";
import Settings from "./screens/Settings";

const App = () => {
	const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

	return (
		<BrowserRouter>
			<Routes>
				{session ? (
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
				)}
			</Routes>
		</BrowserRouter>
	);
};

export default App;
