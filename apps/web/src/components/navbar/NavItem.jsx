import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const NavItem = ({ text, link, active, activeIconSrc, inactiveIconSrc }) => {
	return (
		<Link to={link}>
			<div
				className={`${
					active
						? "bg-cGreen-lightTrans border border-cGreen-light"
						: "bg-white hover:cursor-pointer hover:bg-slate-50 border border-slate-100"
				} w-full flex items-center gap-3.5 py-3 px-4 rounded-lg`}
			>
				<div className="w-7 h-7">
					<img src={active ? activeIconSrc : inactiveIconSrc} className="w-7" />
				</div>
				<div className={`${active ? "text-cGreen-dark font-semibold" : "text-slate-500"} text-sm`}>{text}</div>
			</div>
		</Link>
	);
};

NavItem.propTypes = {
	active: PropTypes.bool,
	text: PropTypes.string,
	link: PropTypes.string,
	activeIconSrc: PropTypes.string,
	inactiveIconSrc: PropTypes.string,
};

export default NavItem;
