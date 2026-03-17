import { create } from "zustand";
import { defaultFilter } from "../constants/Filters";

const today = new Date();
const DASHBOARD_PAGE_STORAGE_KEY = "dashboard_page";

const getStoredDashboardPage = () => {
	if (typeof window === "undefined") return 0;

	const rawValue = window.sessionStorage.getItem(DASHBOARD_PAGE_STORAGE_KEY);
	const parsedValue = Number(rawValue);

	return Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
};

const setStoredDashboardPage = (page) => {
	if (typeof window === "undefined") return;

	window.sessionStorage.setItem(DASHBOARD_PAGE_STORAGE_KEY, String(page));
};

const store = (set) => ({
	filters: [{ ...defaultFilter }],
	setFilters: (filters) => {
		set(() => ({ filters, dashboardPage: 0 }));
	},
	notification: null,
	setNotification: (notification) => set(() => ({ notification })),

	session: null,
	setSession: (session) => set(() => ({ session })),

	dashboardSortState: null,
	setDashboardSortState: (state) => set(() => ({ dashboardSortState: state })),
	dashboardPage: getStoredDashboardPage(),
	setDashboardPage: (page) =>
		set(() => {
			setStoredDashboardPage(page);
			return { dashboardPage: page };
		}),

	spendingYear: today.getFullYear(),
	setSpendingYear: (year) => set(() => ({ spendingYear: year })),

	budgetsMonth: today.getMonth() + 1,
	setBudgetsMonth: (month) => set(() => ({ budgetsMonth: month })),
	budgetsYear: today.getFullYear(),
	setBudgetsYear: (year) => set(() => ({ budgetsYear: year })),

	activeSetting: null,
	setActiveSetting: (setting) => set(() => ({ activeSetting: setting })),

	editingMerchantSetting: null,
	setEditingMerchantSetting: (merchantSetting) => set(() => ({ editingMerchantSetting: merchantSetting })),
	scrollToNewMerchantSetting: false,
	setScrollToNewMerchantSetting: (scroll) => set(() => ({ scrollToNewMerchantSetting: scroll })),

	editingNotesTransaction: null,
	setEditingNotesTransaction: (editingNotesTransaction) => set(() => ({ editingNotesTransaction })),

	removingPlaidItem: null,
	setRemovingPlaidItem: (removingPlaidItem) => set(() => ({ removingPlaidItem })),
});

export const useDataStore = create(store);
