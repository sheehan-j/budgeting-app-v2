import { ApiError } from "./apiError";

type QueryValue = string | number | boolean;
type QueryParams = Record<string, QueryValue | null | undefined>;
type RequestOptions<TBody> = {
	body?: TBody;
	query?: QueryParams;
}

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const resolveBaseUrl = (value: string) => {
	const trimmedValue = value.replace(/\/$/, "");

	if (/^https?:\/\//i.test(trimmedValue)) {
		return trimmedValue;
	}

	if (typeof window !== "undefined") {
		return new URL(trimmedValue, window.location.origin).toString().replace(/\/$/, "");
	}

	return trimmedValue;
};

const apiBaseUrl = resolveBaseUrl(rawApiBaseUrl);

const buildUrl = (path: string, query?: QueryParams) => {
	const url = new URL(`${apiBaseUrl}${path}`);

	if (query) {
		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				url.searchParams.set(key, String(value));
			}
		});
	}

	return url.toString();
};

const request = async <TResponse, TBody = unknown>(
	method: string,
	path: string,
	{ body, query }: RequestOptions<TBody> = {},
): Promise<TResponse> => {
	const response = await fetch(buildUrl(path, query), {
		method,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		...(body !== undefined ? { body: JSON.stringify(body) } : {}),
	});

	const contentType = response.headers.get("content-type") || "";
	const data = contentType.includes("application/json") ? await response.json() : null;

	if (!response.ok) {
		throw new ApiError(data?.message || "Request failed", {
			status: response.status,
			fieldErrors: data?.fieldErrors,
			data,
		});
	}

	return data as TResponse;
};

const apiClient = {
	get: <TResponse>(path: string, query?: QueryParams) => request<TResponse>("GET", path, { query }),
	post: <TResponse, TBody = unknown>(path: string, body: TBody) => request<TResponse, TBody>("POST", path, { body }),
	put: <TResponse, TBody = unknown>(path: string, body: TBody) => request<TResponse, TBody>("PUT", path, { body }),
	patch: <TResponse, TBody = unknown>(path: string, body: TBody) =>
		request<TResponse, TBody>("PATCH", path, { body }),
	del: <TResponse, TBody = unknown>(path: string, body?: TBody) =>
		request<TResponse, TBody>("DELETE", path, { body }),
};

export type { QueryParams };
export default apiClient;
