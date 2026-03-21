import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDataStore } from "./util/dataStore";
import { getApiErrorMessage } from "./util/apiError";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			useDataStore.getState().setNotification({
				type: "error",
				message: getApiErrorMessage(error),
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
