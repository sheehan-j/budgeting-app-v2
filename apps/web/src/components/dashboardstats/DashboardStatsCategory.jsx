import PropTypes from "prop-types";

const DashboardStatsCategory = ({ category }) => {
	return (
		<div className="flex flex-col bg-transparent gap-1.5">
			<div className="w-full flex justify-between items-center">
				<div>
					{category.name} {`(${category.percentage.toFixed()}%)`}
				</div>
				<div className="font-semibold">{category.amount.toFixed(2)}</div>
			</div>
			<div
				className="h-2 w-full rounded-3xl overflow-hidden"
				style={{
					backgroundColor: category.colorLight,
					borderWidth: "1px",
					borderColor: category.colorDark,
				}}
			>
				<div
					className="h-full"
					style={{
						backgroundColor: category.colorDark,
						width: `${category.percentage}%`,
					}}
				></div>
			</div>
		</div>
	);
};

DashboardStatsCategory.propTypes = {
	category: PropTypes.object,
};

export default DashboardStatsCategory;
