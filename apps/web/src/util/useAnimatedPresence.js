import { useCallback, useRef, useState } from "react";

export const useAnimatedPresence = (initialOpen = false) => {
	const [isOpen, setIsOpen] = useState(initialOpen);
	const [isMounted, setIsMounted] = useState(initialOpen);
	const [animationState, setAnimationState] = useState(initialOpen ? "enter" : null);
	const pendingCloseResolveRef = useRef(null);
	const pendingClosePromiseRef = useRef(null);

	const resolvePendingClose = useCallback(() => {
		if (pendingCloseResolveRef.current) {
			pendingCloseResolveRef.current();
			pendingCloseResolveRef.current = null;
		}

		pendingClosePromiseRef.current = null;
	}, []);

	const open = useCallback(() => {
		resolvePendingClose();
		setIsMounted(true);
		setIsOpen(true);
		setAnimationState("enter");
	}, [resolvePendingClose]);

	const close = useCallback(() => {
		setIsOpen(false);
		setAnimationState("exit");
	}, []);

	const closeAndWait = useCallback(() => {
		if (!isMounted) return Promise.resolve();
		if (pendingClosePromiseRef.current) return pendingClosePromiseRef.current;

		close();

		pendingClosePromiseRef.current = new Promise((resolve) => {
			pendingCloseResolveRef.current = resolve;
		});

		return pendingClosePromiseRef.current;
	}, [close, isMounted]);

	const toggle = useCallback(() => {
		if (isOpen) close();
		else open();
	}, [close, isOpen, open]);

	const onAnimationEnd = useCallback((event) => {
		if (event.target !== event.currentTarget) return;

		if (animationState === "exit") {
			setIsMounted(false);
			resolvePendingClose();
		}

		setAnimationState(null);
	}, [animationState, resolvePendingClose]);

	return {
		isOpen,
		isMounted,
		animationClass: animationState ?? "",
		open,
		close,
		closeAndWait,
		toggle,
		onAnimationEnd,
	};
};
