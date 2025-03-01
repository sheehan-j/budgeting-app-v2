import { create } from "zustand";
import { openMenu, closeMenu, openCategoryMenu, closeCategoryMenu } from "./animationUtil";

const store = (set, get) => ({
	filterMenuVisible: false,
	filterMenuAnimating: false,
	setFilterMenuVisible: (value) => set({ filterMenuVisible: value }),
	setFilterMenuAnimating: (value) => set({ filterMenuAnimating: value }),
	openFilterMenu: () => {
		const { setFilterMenuVisible, setFilterMenuAnimating } = get();
		openMenu(setFilterMenuVisible, setFilterMenuAnimating);
	},
	closeFilterMenu: () => {
		const { setFilterMenuVisible, setFilterMenuAnimating } = get();
		closeMenu(setFilterMenuVisible, setFilterMenuAnimating);
	},

	uploadModalVisible: false,
	uploadModalAnimating: false,
	setUploadModalVisible: (value) => set({ uploadModalVisible: value }),
	setUploadModalAnimating: (value) => set({ uploadModalAnimating: value }),
	openUploadModal: () => {
		const { setUploadModalVisible, setUploadModalAnimating } = get();
		openMenu(setUploadModalVisible, setUploadModalAnimating);
	},
	closeUploadModal: () => {
		const { setUploadModalVisible, setUploadModalAnimating } = get();
		closeMenu(setUploadModalVisible, setUploadModalAnimating);
	},

	notesModalVisible: false,
	notesModalAnimating: false,
	setNotesModalVisible: (value) => set({ notesModalVisible: value }),
	setNotesModalAnimating: (value) => set({ notesModalAnimating: value }),
	openNotesModal: () => {
		const { setNotesModalVisible, setNotesModalAnimating } = get();
		openMenu(setNotesModalVisible, setNotesModalAnimating);
	},
	closeNotesModal: () => {
		const { setNotesModalVisible, setNotesModalAnimating } = get();
		closeMenu(setNotesModalVisible, setNotesModalAnimating);
	},

	bulkActionsMenuVisible: false,
	bulkActionsMenuAnimating: false,
	setBulkActionsMenuVisible: (value) => set({ bulkActionsMenuVisible: value }),
	setBulkActionsMenuAnimating: (value) => set({ bulkActionsMenuAnimating: value }),
	openBulkActionsMenu: () => {
		const { setBulkActionsMenuVisible, setBulkActionsMenuAnimating } = get();
		openMenu(setBulkActionsMenuVisible, setBulkActionsMenuAnimating);
	},
	closeBulkActionsMenu: () => {
		const { setBulkActionsMenuVisible, setBulkActionsMenuAnimating } = get();
		closeMenu(setBulkActionsMenuVisible, setBulkActionsMenuAnimating);
	},

	visibleCategoryMenu: null,
	animatingCategoryMenu: null,
	categoryMenuDirectionDown: true,
	setVisibleCategoryMenu: (value) => set({ visibleCategoryMenu: value }),
	setAnimatingCategoryMenu: (value) => set({ animatingCategoryMenu: value }),
	setCategoryMenuDirectionDown: (value) => set({ categoryMenuDirectionDown: value }),
	openCategoryMenu: (transactionId, buttonRef, tableRef) => {
		const { visibleCategoryMenu, setCategoryMenuDirectionDown, setAnimatingCategoryMenu, setVisibleCategoryMenu } =
			get();
		openCategoryMenu(
			transactionId,
			buttonRef,
			tableRef,
			visibleCategoryMenu,
			setCategoryMenuDirectionDown,
			setAnimatingCategoryMenu,
			setVisibleCategoryMenu
		);
	},
	closeCategoryMenu: () => {
		const { visibleCategoryMenu, setAnimatingCategoryMenu, setVisibleCategoryMenu } = get();
		closeCategoryMenu(visibleCategoryMenu, setAnimatingCategoryMenu, setVisibleCategoryMenu);
	},

	visibleTransactionMenu: null,
	animatingTransactionMenu: null,
	setVisibleTransactionMenu: (value) => set({ visibleTransactionMenu: value }),
	setAnimatingTransactionMenu: (value) => set({ animatingTransactionMenu: value }),
	openTransactionMenu: (transactionId) => {
		const { setAnimatingTransactionMenu, setVisibleTransactionMenu } = get();
		setAnimatingTransactionMenu(transactionId);
		setVisibleTransactionMenu(transactionId);
		setTimeout(() => {
			setAnimatingTransactionMenu(null);
		}, 200);
	},
	closeTransactionMenu: () => {
		const { visibleTransactionMenu, setAnimatingTransactionMenu, setVisibleTransactionMenu } = get();
		setAnimatingTransactionMenu(visibleTransactionMenu);
		setVisibleTransactionMenu(null);
		setTimeout(() => {
			setAnimatingTransactionMenu(null);
		}, 200);
	},
});

export const useAnimationStore = create(store);
