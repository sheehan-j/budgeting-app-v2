import { useEffect } from "react";
import { useDataStore } from "../util/dataStore";
import MerchantSettings from "../components/settingspage/merchantsettings/MerchantSettings";
import PlaidConnections from "../components/settingspage/plaid/PlaidConnections";
import RemovePlaidItemModal from "../components/settingspage/plaid/RemovePlaidItemModal";
import Navbar from "../components/navbar/Navbar";
import NotificationBanner from "../components/common/NotificationBanner";
import SettingsNavBar from "../components/settingspage/SettingsNavBar";
import CategoriesSettings from "../components/settingspage/categories/CategoriesSettings";

const Settings = () => {
	const { activeSetting, setActiveSetting } = useDataStore((state) => ({
		activeSetting: state.activeSetting,
		setActiveSetting: state.setActiveSetting,
	}));
	const settings = ["Connected Accounts", "Merchants", "Categories"];

	useEffect(() => {
		if (activeSetting === null) setActiveSetting(settings[0]);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeSetting]);

	return (
		<div className="w-screen h-screen flex overflow-hidden relative">
			<Navbar activePage={"Settings"} />
			<div className="grow h-full flex gap-3 overflow-y-auto bg-slate-100 p-4 md:p-8 lg:p-8 xl:p-16 2xl:p-32">
				<SettingsNavBar settings={settings} activeSetting={activeSetting} setActiveSetting={setActiveSetting} />
				<div className="grow h-full flex bg-white border border-slate-300 rounded-2xl">
					{activeSetting === "Connected Accounts" && <PlaidConnections />}
					{activeSetting === "Merchants" && <MerchantSettings />}
					{activeSetting === "Categories" && <CategoriesSettings />}
				</div>
			</div>
			<NotificationBanner />
			<RemovePlaidItemModal />
		</div>
	);
};

export default Settings;
