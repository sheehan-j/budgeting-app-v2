import React from "react";
import ReactDOM from "react-dom/client";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { useDataStore } from "./util/dataStore";
import "./index.css";

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			useDataStore.getState().setNotification({
				type: "error",
				message: error instanceof Error ? error.message : "Request failed.",
			});
		},
	}),
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</React.StrictMode>,
);
