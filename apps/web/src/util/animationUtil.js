const animationTimeouts = new Map();

const clearAnimationTimeout = (setAnimating) => {
	const existingTimeout = animationTimeouts.get(setAnimating);
	if (existingTimeout) {
		clearTimeout(existingTimeout);
		animationTimeouts.delete(setAnimating);
	}
};

const scheduleAnimationReset = (setAnimating, value, delay) => {
	clearAnimationTimeout(setAnimating);

	const timeoutId = setTimeout(() => {
		setAnimating(value);
		animationTimeouts.delete(setAnimating);
	}, delay);

	animationTimeouts.set(setAnimating, timeoutId);
};

export const openMenu = (setMenuVisible, setMenuAnimating) => {
	setMenuAnimating(true);
	setMenuVisible(true);
	scheduleAnimationReset(setMenuAnimating, false, 100);
};

export const closeMenu = async (setMenuVisible, setMenuAnimating) => {
	setMenuAnimating(true);
	setMenuVisible(false);

	return new Promise((resolve) => {
		clearAnimationTimeout(setMenuAnimating);

		const timeoutId = setTimeout(() => {
			setMenuAnimating(false);
			animationTimeouts.delete(setMenuAnimating);
			resolve();
		}, 100);

		animationTimeouts.set(setMenuAnimating, timeoutId);
	});
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
	scheduleAnimationReset(setAnimatingCategoryMenu, null, 100);
};

export const closeCategoryMenu = async (visibleCategoryMenu, setAnimatingCategoryMenu, setVisibleCategoryMenu) => {
	setAnimatingCategoryMenu(visibleCategoryMenu);
	setVisibleCategoryMenu(null);

	return new Promise((resolve) => {
		clearAnimationTimeout(setAnimatingCategoryMenu);

		const timeoutId = setTimeout(() => {
			setAnimatingCategoryMenu(null);
			animationTimeouts.delete(setAnimatingCategoryMenu);
			resolve();
		}, 100);

		animationTimeouts.set(setAnimatingCategoryMenu, timeoutId);
	});
};
