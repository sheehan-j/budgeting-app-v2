import PropTypes from "prop-types";
import { useDataStore } from "../../../util/dataStore";
import { useCurrentDashboardQuery } from "../../../queries/useCurrentDashboardQuery";

const ConfigurationFilterMenu = ({ setSelectedFilterOptions }) => {
	const { filters, setFilters } = useDataStore((state) => ({
		filters: state.filters,
		setFilters: state.setFilters,
	}));

  const { data: dashboardData } = useCurrentDashboardQuery();
	const transactions = dashboardData?.transactions ?? [];
	const configurations = [...new Set(transactions.map((tx) => tx.configurationName))];

	return (
		<div className="flex flex-col gap-1">
			{configurations.map((configuration) => (
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
