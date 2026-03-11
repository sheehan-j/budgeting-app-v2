import PropTypes from "prop-types";
import { useDataStore } from "../../util/dataStore";
import { getDashboardStats } from "../../util/statsUtil";

const ConfigurationFilterMenu = ({ setSelectedFilterOptions }) => {
	const { transactions, filters, setFilters, setDashboardStats } = useDataStore((state) => ({
		transactions: state.transactions,
		filters: state.filters,
		setFilters: state.setFilters,
		setDashboardStats: state.setDashboardStats,
	}));

	return (
		<div className="flex flex-col gap-1">
			{[...new Set(transactions.map((tx) => tx.configurationName))].map((configuration) => (
				<button
					key={configuration}
					className="add-filter-option text-sm text-start hover:bg-slate-50 px-2.5 py-0.5 "
					onClick={async () => {
						setSelectedFilterOptions(null);
						if (
							filters.some(
								(filter) => filter?.type === "Configuration" && filter?.configuration === configuration
							)
						) {
							return;
						}
						const newFilters = [...filters, { type: "Configuration", configuration: configuration }];
						setFilters(newFilters);
						setDashboardStats(await getDashboardStats(transactions, newFilters));
					}}
				>
					{configuration}
				</button>
			))}
		</div>
	);
};

ConfigurationFilterMenu.propTypes = {
	selectedFilterOptions: PropTypes.object,
	setSelectedFilterOptions: PropTypes.func,
};

export default ConfigurationFilterMenu;
