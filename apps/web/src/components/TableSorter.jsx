import PropTypes from "prop-types";

const TableSorter = ({ column, sortState, onSorterClick }) => {
	return (
		<button
			className="w-2"
			onClick={() => {
				onSorterClick(column);
			}}
		>
			{sortState?.column === column && sortState?.direction === "desc" && <img src="./sorter_desc.svg" />}
			{sortState?.column === column && sortState?.direction === "asc" && <img src="./sorter_asc.svg" />}
			{(!sortState || sortState?.column !== column) && <img src="./sorter.svg" />}
		</button>
	);
};

TableSorter.propTypes = {
	column: PropTypes.string,
	sortState: PropTypes.shape({
		column: PropTypes.string.isRequired,
		direction: PropTypes.oneOf(["asc", "desc"]).isRequired,
	}),
	onSorterClick: PropTypes.func,
};

export default TableSorter;
