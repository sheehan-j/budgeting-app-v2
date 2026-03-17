import { useEffect } from "react";
import { useDataStore } from "../util/dataStore";
import MerchantSettings from "../components/settingspage/merchantsettings/MerchantSettings";
import PlaidConnections from "../components/settingspage/plaid/PlaidConnections";
import Navbar from "../components/navbar/Navbar";
import NotificationBanner from "../components/common/NotificationBanner";
import SettingsNavBar from "../components/settingspage/SettingsNavBar";

const Settings = () => {
	const { activeSetting, setActiveSetting } = useDataStore((state) => ({
		activeSetting: state.activeSetting,
		setActiveSetting: state.setActiveSetting,
	}));
	const settings = ["Connected Accounts", "Merchants"];

	useEffect(() => {
		if (activeSetting === null) setActiveSetting(settings[0]);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSetting]);

	return (
		<div className="w-screen h-screen flex relative">
			<Navbar activePage={"Settings"} />
			<div className="grow h-full flex gap-3 overflow-y-auto bg-slate-100 p-4 md:p-8 lg:p-8 xl:p-16 2xl:p-32">
				<SettingsNavBar settings={settings} activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
				<div className="grow h-full flex bg-white border border-slate-300 rounded-2xl">
					{activeSetting === "Connected Accounts" && <PlaidConnections />}
					{activeSetting === "Merchants" && <MerchantSettings />}
				</div>
			</div>
			<NotificationBanner />
		</div>
	);
};

export default Settings;
