import { create } from "zustand";
import { defaultFilter } from "../constants/Filters";

const today = new Date();

const store = (set) => ({
	filters: [{ ...defaultFilter }],
	setFilters: (filters) => {
		set(() => ({ filters }));
	},
	notification: null,
	setNotification: (notification) => set(() => ({ notification })),

	session: null,
	setSession: (session) => set(() => ({ session })),

	dashboardSortState: null,
	setDashboardSortState: (state) => set(() => ({ dashboardSortState: state })),

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
});

export const useDataStore = create(store);
