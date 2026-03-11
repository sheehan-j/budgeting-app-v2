export const openMenu = (setMenuVisible, setMenuAnimating) => {
	setMenuAnimating(true);
	setMenuVisible(true);
	setTimeout(() => {
		setMenuAnimating(false);
	}, 100);
};

export const closeMenu = (setMenuVisible, setMenuAnimating) => {
	setMenuAnimating(true);
	setMenuVisible(false);
	setTimeout(() => {
		setMenuAnimating(false);
	}, 100);
};

export const openCategoryMenu = (
	transactionId,
	buttonRef,
	tableRef,
	visibleCategoryMenu,
	setMenuDirectionDown,
	setAnimatingCategoryMenu,
	setVisibleCategoryMenu
) => {
	if (visibleCategoryMenu === transactionId) return;

	const buttonRect = buttonRef.getBoundingClientRect();
	const tableRect = tableRef.current.getBoundingClientRect();
	const spaceBelow = tableRect.bottom - buttonRect.bottom;
	const spaceAbove = buttonRect.top - tableRect.top;

	if (spaceBelow < 450 && spaceAbove > spaceBelow) {
		setMenuDirectionDown(false);
	} else {
		setMenuDirectionDown(true);
	}

	setAnimatingCategoryMenu(transactionId);
	setVisibleCategoryMenu(transactionId);
	setTimeout(() => {
		setAnimatingCategoryMenu(null);
	}, 200);
};

export const closeCategoryMenu = (visibleCategoryMenu, setAnimatingCategoryMenu, setVisibleCategoryMenu) => {
	// if (!visibleCategoryMenu) return;
	setAnimatingCategoryMenu(visibleCategoryMenu);
	setVisibleCategoryMenu(null);
	setTimeout(() => {
		setAnimatingCategoryMenu(null);
	}, 200);
};
