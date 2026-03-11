import PropTypes from "prop-types";
import { useState } from "react";
import { daysByMonth } from "../../constants/Dates";
import { useDataStore } from "../../util/dataStore";
import { getDashboardStats } from "../../util/statsUtil";

const DateFilterMenu = ({ selectedFilterOptions, setSelectedFilterOptions }) => {
	const { transactions, filters, setFilters, setDashboardStats } = useDataStore((state) => ({
		transactions: state.transactions,
		filters: state.filters,
		setFilters: state.setFilters,
		setDashboardStats: state.setDashboardStats,
	}));

	const [dateType, setDateType] = useState("month");

	return (
		<div className="add-filter-option flex flex-col justify-start grow px-2.5 pb-2 gap-2">
			<div className="flex gap-1">
				<button
					className={`px-2 py-0.5 text-xs rounded border border-slate-200 ${
						dateType === "month" ? "bg-cGreen-lighter" : "hover:bg-slate-50"
					}`}
					onClick={() => setDateType("month")}
				>
					Month
				</button>
				<button
					className={`px-2 py-0.5 text-xs rounded border border-slate-200 ${
						dateType === "range" ? "bg-cGreen-lighter" : "hover:bg-slate-50"
					}`}
					onClick={() => setDateType("range")}
				>
					Range
				</button>
			</div>
			{dateType === "month" && (
				<div className="add-filter-option">
					<div className="flex gap-1">
						<select
							value={selectedFilterOptions.start.month}
							onChange={(e) =>
								setSelectedFilterOptions({
									...selectedFilterOptions,
									start: {
										...selectedFilterOptions.start,
										month: e.target.value,
										day: 1,
									},
									end: {
										...selectedFilterOptions.end,
										month: e.target.value,
										day: daysByMonth[e.target.value].length,
									},
								})
							}
							className="add-filter-option flex-[1.1_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
						>
							{Array.from({ length: 12 }, (_, index) => (
								<option key={index + 1} value={index + 1}>
									{index + 1}
								</option>
							))}
						</select>
						<select
							value={selectedFilterOptions.start.year}
							onChange={(e) =>
								setSelectedFilterOptions({
									...selectedFilterOptions,
									start: { ...selectedFilterOptions.start, year: e.target.value },
									end: { ...selectedFilterOptions.end, year: e.target.value },
								})
							}
							className="add-filter-option flex-[1.8_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
						>
							{Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, index) => (
								<option key={new Date().getFullYear() - index} value={new Date().getFullYear() - index}>
									{new Date().getFullYear() - index}
								</option>
							))}
						</select>
					</div>
				</div>
			)}
			{dateType === "range" && (
				<>
					<div className="add-filter-option">
						<div className="add-filter-option text-xs font-medium">Start</div>
						<div className="flex gap-1">
							<select
								value={selectedFilterOptions.start.month}
								onChange={(e) =>
									setSelectedFilterOptions({
										...selectedFilterOptions,
										start: {
											...selectedFilterOptions.start,
											month: e.target.value,
											day:
												selectedFilterOptions.start.day > daysByMonth[e.target.value].length
													? daysByMonth[e.target.value].length
													: selectedFilterOptions.start.day,
										},
									})
								}
								className="add-filter-option flex-[1.1_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
							>
								{Array.from({ length: 12 }, (_, index) => (
									<option key={index + 1} value={index + 1}>
										{index + 1}
									</option>
								))}
							</select>
							<select
								value={selectedFilterOptions.start.day}
								onChange={(e) =>
									setSelectedFilterOptions({
										...selectedFilterOptions,
										start: { ...selectedFilterOptions.start, day: e.target.value },
									})
								}
								className="add-filter-option flex-[1.1_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
							>
								{daysByMonth[selectedFilterOptions.start.month].map((day) => (
									<option key={day} value={day}>
										{day}
									</option>
								))}
							</select>
							<select
								value={selectedFilterOptions.start.year}
								onChange={(e) =>
									setSelectedFilterOptions({
										...selectedFilterOptions,
										start: { ...selectedFilterOptions.start, year: e.target.value },
									})
								}
								className="add-filter-option flex-[1.8_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
							>
								{Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, index) => (
									<option
										key={new Date().getFullYear() - index}
										value={new Date().getFullYear() - index}
									>
										{new Date().getFullYear() - index}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="add-filter-option">
						<div className="add-filter-option text-xs font-medium">End</div>
						<div className="flex gap-1">
							<select
								value={selectedFilterOptions.end.month}
								onChange={(e) =>
									setSelectedFilterOptions({
										...selectedFilterOptions,
										end: {
											...selectedFilterOptions.end,
											month: e.target.value,
											day:
												selectedFilterOptions.end.day > daysByMonth[e.target.value].length
													? daysByMonth[e.target.value].length
													: selectedFilterOptions.end.day,
										},
									})
								}
								className="add-filter-option flex-[1.1_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
							>
								{Array.from({ length: 12 }, (_, index) => (
									<option key={index + 1} value={index + 1}>
										{index + 1}
									</option>
								))}
							</select>
							<select
								value={selectedFilterOptions.end.day}
								onChange={(e) =>
									setSelectedFilterOptions({
										...selectedFilterOptions,
										end: { ...selectedFilterOptions.end, day: e.target.value },
									})
								}
								className="add-filter-option flex-[1.1_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
							>
								{daysByMonth[selectedFilterOptions.end.month].map((day) => (
									<option key={day} value={day}>
										{day}
									</option>
								))}
							</select>
							<select
								value={selectedFilterOptions.end.year}
								onChange={(e) =>
									setSelectedFilterOptions({
										...selectedFilterOptions,
										end: { ...selectedFilterOptions.end, year: e.target.value },
									})
								}
								className="add-filter-option flex-[1.8_0_0] w-full text-xs border border-slate-200 rounded p-1 bg-white outline-none"
							>
								{Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, index) => (
									<option
										key={new Date().getFullYear() - index}
										value={new Date().getFullYear() - index}
									>
										{new Date().getFullYear() - index}
									</option>
								))}
							</select>
						</div>
					</div>
				</>
			)}
			<button
				onClick={async () => {
					const tempSelectedFilterOptions = { ...selectedFilterOptions };
					setSelectedFilterOptions(null);

					if (
						filters.some(
							(filter) =>
								filter?.type === "Date" &&
								filter?.start?.month === tempSelectedFilterOptions.start.month &&
								filter?.start?.day === tempSelectedFilterOptions.start.day &&
								filter?.start?.year === tempSelectedFilterOptions.start.year &&
								filter?.end?.month === tempSelectedFilterOptions.end.month &&
								filter?.end?.day === tempSelectedFilterOptions.end.day &&
								filter?.end?.year === tempSelectedFilterOptions.end.year
						)
					) {
						return;
					}
					const newFilters = [...filters, tempSelectedFilterOptions];
					setFilters([...filters, tempSelectedFilterOptions]);
					setDashboardStats(await getDashboardStats(transactions, newFilters));
				}}
				className="add-filter-option text-xs hover:bg-slate-50 border border-slate-200 rounded w-full py-0.5"
			>
				Add
			</button>
		</div>
	);
};

DateFilterMenu.propTypes = {
	selectedFilterOptions: PropTypes.object,
	setSelectedFilterOptions: PropTypes.func,
};

export default DateFilterMenu;
