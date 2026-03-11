const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const buildHeaders = (headers) => {
	return {
		Accept: "application/json",
		...headers,
	};
};

export const apiFetch = async (path, options = {}) => {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: buildHeaders(options.headers),
	});

	if (!response.ok) {
		let message = `Request failed with status ${response.status}`;

		try {
			const errorBody = await response.json();
			if (errorBody?.error) message = errorBody.error;
		} catch {
			// Keep the generic message when the response is not JSON.
		}

		throw new Error(message);
	}

	if (response.status === 204) return null;

	return response.json();
};
