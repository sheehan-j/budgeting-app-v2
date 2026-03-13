export const getBudgetsQueryKey = (
	userId: string | undefined,
	month: number | string,
	year: number | string,
) => ["budgets", userId, Number(month), Number(year)] as const;
