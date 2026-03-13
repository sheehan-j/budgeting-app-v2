import { useEffect } from "react";

export const useClickOutside = (ref, onOutsideClick, enabled = true) => {
	useEffect(() => {
		if (!enabled) return;

		const handlePointerDown = (event) => {
			if (!ref.current || ref.current.contains(event.target)) return;
			onOutsideClick();
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("touchstart", handlePointerDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
		};
	}, [enabled, onOutsideClick, ref]);
};
