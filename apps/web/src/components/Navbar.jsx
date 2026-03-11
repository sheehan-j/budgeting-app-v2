import PropTypes from "prop-types";
import NavItem from "./NavItem";
import supabase from "../config/supabaseClient";
import { useDataStore } from "../util/dataStore";

const Navbar = ({ activePage }) => {
	const { setNotification } = useDataStore((state) => ({
		setNotification: state.setNotification,
	}));

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			setNotification({ message: error.message, type: "error" });
			return;
		}
		localStorage.clear();
		window.location.reload();
		window.location = "/";
	};

	return (
		<nav className="h-full shrink-0 w-4/12 md:w-3/12 xl:w-[18%] 2xl:w-2/12 bg-white flex flex-col justify-between gap-5">
			<div className="flex flex-col gap-5 px-6 py-10 ">
				{/* <div className="font-extrabold text-cGreen-dark text-4xl px-3">LOGO</div> */}
				<NavItem
					text={"Dashboard"}
					link={"/"}
					active={activePage === "Dashboard"}
					activeIconSrc={"./dashboard_green.svg"}
					inactiveIconSrc={"./dashboard_slate.svg"}
				/>
				<NavItem
					text={"Spending"}
					link={"/spending"}
					active={activePage === "Spending"}
					activeIconSrc={"./spending_green.svg"}
					inactiveIconSrc={"./spending_slate.svg"}
				/>
				<NavItem
					text={"Budgets"}
					link={"/budgets"}
					active={activePage === "Budgets"}
					activeIconSrc={"./transactions_green.svg"}
					inactiveIconSrc={"./transactions_slate.svg"}
				/>
				<NavItem
					text={"Settings"}
					link={"/settings"}
					active={activePage === "Settings"}
					activeIconSrc={"./settings_green.svg"}
					inactiveIconSrc={"./settings_slate.svg"}
				/>
			</div>
			<div className="border-t border-slate-300 px-6 pb-10 pt-5">
				<button
					onClick={handleLogout}
					className="bg-white hover:cursor-pointer hover:bg-slate-50 border border-slate-100 w-full flex items-center gap-3.5 py-3 px-4 rounded-lg"
				>
					<div className="w-7 h-7">
						<img src="./logout_slate.svg" className="w-7" />
					</div>
					<div className="text-slate-500 text-sm">Logout</div>
				</button>
			</div>
		</nav>
	);
};

Navbar.propTypes = {
	activePage: PropTypes.string,
};

export default Navbar;
