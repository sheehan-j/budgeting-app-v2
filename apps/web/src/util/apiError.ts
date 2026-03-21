type ApiErrorOptions = {
	status?: number;
	fieldErrors?: Record<string, string[]>;
	data?: unknown;
};

export class ApiError extends Error {
	status?: number;
	fieldErrors: Record<string, string[]>;
	data?: unknown;

	constructor(message: string, options: ApiErrorOptions = {}) {
		super(message);
		this.name = "ApiError";
		this.status = options.status;
		this.fieldErrors = options.fieldErrors ?? {};
		this.data = options.data;
	}
}

export const getApiErrorMessage = (error) => {
	if (error?.fieldErrors) {
		const firstFieldError = Object.values(error.fieldErrors).find(
			(messages) => Array.isArray(messages) && messages.length > 0,
		);
		if (firstFieldError) return firstFieldError[0];
	}

	if (error instanceof Error) return error.message;
	return "Request failed";
};
