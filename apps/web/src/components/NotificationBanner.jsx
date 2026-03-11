import { useDataStore } from "../util/dataStore";
import { useEffect, useState } from "react";

const NotificationBanner = () => {
	const { notification, setNotification } = useDataStore((state) => ({
		notification: state.notification,
		setNotification: state.setNotification,
	}));
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (notification?.type) {
			setTimeout(() => {
				setVisible(true);
				setTimeout(() => {
					setVisible(false);
					setTimeout(() => {
						setNotification(null);
					}, 1000);
				}, 5000);
			}, 100);
		} else {
			setVisible(false);
		}
	}, [notification, setNotification]);

	return (
		<>
			{notification?.type === "success" && (
				<div
					style={{ ...styles.slide, top: visible ? "1rem" : "-5rem" }}
					className="absolute z-[100] right-4 w-[20rem] border  bg-cGreen-lighter text-cGreen-dark border border-cGreen rounded-lg p-2 text-sm"
				>
					{notification.message}
				</div>
			)}
			{notification?.type === "error" && (
				<div
					style={{ ...styles.slide, top: visible ? "1rem" : "-5rem" }}
					className="absolute z-[100] right-4 w-[20rem] border bg-red-50 text-red-400 border border-red-400 rounded-lg p-2 text-sm"
				>
					Error: {notification.message}
				</div>
			)}
		</>
	);
};

const styles = {
	slide: {
		transition: "all 0.4s", // Use transition for the sliding effect
	},
};

export default NotificationBanner;
