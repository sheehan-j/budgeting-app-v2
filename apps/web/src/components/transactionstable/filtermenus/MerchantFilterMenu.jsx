import PropTypes from "prop-types";
import { useDataStore } from "../../../util/dataStore";

const MerchantFilterMenu = ({ selectedFilterOptions, setSelectedFilterOptions }) => {
	const { filters, setFilters, setNotification } = useDataStore((state) => ({
		filters: state.filters,
		setFilters: state.setFilters,
		setNotification: state.setNotification,
	}));

	return (
		<div className="flex flex-col grow px-2 pb-2 gap-1">
			<textarea
				className="add-filter-option outline-none text-xs p-1 grow resize-none border border-slate-200 rounded"
				placeholder="Enter search term"
				value={selectedFilterOptions.merchant}
				onChange={(e) => setSelectedFilterOptions({ ...selectedFilterOptions, merchant: e.target.value })}
			/>
			<button
				onClick={async () => {
					if (selectedFilterOptions.merchant === "") {
						setNotification({ message: "Merchant cannot be empty.", type: "error" });
						return;
					}

					const tempSelectedFilterOptions = { ...selectedFilterOptions };
					setSelectedFilterOptions(null);
					if (
						filters.some(
							(filter) =>
								filter?.type === "Merchant" && filter?.merchant === tempSelectedFilterOptions.merchant,
						)
					) {
						return;
					}
					setFilters([...filters, tempSelectedFilterOptions]);
				}}
				className="add-filter-option text-xs hover:bg-slate-50 border border-slate-200 rounded w-full py-0.5"
			>
				Add
			</button>
		</div>
	);
};

MerchantFilterMenu.propTypes = {
	selectedFilterOptions: PropTypes.object,
	setSelectedFilterOptions: PropTypes.func,
};

export default MerchantFilterMenu;
