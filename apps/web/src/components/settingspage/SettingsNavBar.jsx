import PropTypes from "prop-types";

const SettingsNavBar = ({ settings, activeSetting, setActiveSetting }) => {
	return (
		<div className="h-full shrink-0 flex bg-white border border-slate-300 rounded-2xl w-1/4 py-6 pr-6 pl-4">
			<div className="w-full h-full overflow-y-auto">
				<div className="text-lg text-slate-600 font-semibold mb-1 px-2">Settings</div>
				<div className="flex flex-col gap-1">
					{settings?.map((setting) => (
						<div
							key={setting}
							className={`${
								activeSetting === setting
									? "bg-slate-100 cursor-default"
									: "cursor-pointer hover:text-slate-600"
							} text-start px-2 py-1 rounded w-full`}
							onClick={() => setActiveSetting(setting)}
						>
							{setting}
						</div>
						// <div
						// 	key={setting}
						// 	className={`${
						// 		activeSetting === setting
						// 			? "border-cGreen text-cGreen cursor-default"
						// 			: "border-slate-300 cursor-pointer"
						// 	} border text-start px-2 py-1 rounded w-full`}
						// >
						// 	{setting}
						// </div>
					))}
				</div>
			</div>
		</div>
	);
};

SettingsNavBar.propTypes = {
	settings: PropTypes.array,
	activeSetting: PropTypes.string,
	setActiveSetting: PropTypes.func,
};

export default SettingsNavBar;
