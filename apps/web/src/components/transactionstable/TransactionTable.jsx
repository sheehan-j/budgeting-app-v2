import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useDataStore } from "../../util/dataStore";
import { useDashboardQuery } from "../../queries/useDashboardQuery";
import { useCategoriesQuery } from "../../queries/useCategoriesQuery";
import { useUpdateTransactionsCategoryMutation } from "../../mutations/useUpdateTransactionsCategoryMutation";
import { useSyncAllPlaidItemsMutation } from "../../mutations/useSyncAllPlaidItemsMutation";
import { formatPlaidSyncSuccessNotification } from "../../util/plaidUtil";
import { sortTransactions } from "../../util/sortUtil";
import TransactionMenu from "./TransactionMenu";
import ButtonSpinner from "../common/ButtonSpinner";
import TransactionTableCategoryButton from "./TransactionTableCategoryButton";
import TableSorter from "./TableSorter";
import FilterButtons from "./MainFilterMenu";
import Pagination from "./Pagination";
import BulkActions from "./BulkActions";

const TransactionTable = () => {
	const {
		dashboardSortState,
		setDashboardSortState,
		dashboardPage,
		setDashboardPage,
		filters,
		setFilters,
		setNotification,
	} = useDataStore((state) => ({
		dashboardSortState: state.dashboardSortState,
		setDashboardSortState: state.setDashboardSortState,
		dashboardPage: state.dashboardPage,
		setDashboardPage: state.setDashboardPage,
		totalTransactionCount: state.totalTransactionCount,
		filters: state.filters,
		setFilters: state.setFilters,
		setNotification: state.setNotification,
	}));

	const tableRef = useRef(null);
	const filtersRef = useRef(null);
	const hasMountedRef = useRef(false);

	const [selectedTransactionIds, setSelectedTransactionIds] = useState([]);
	const [showFilters, setShowFilters] = useState(false);
	const pageSize = 20;

	const { data: categories, isLoading: categoriesLoading } = useCategoriesQuery();
	const {
		data: dashboardData,
		isLoading: dashboardDataLoading,
		isFetching: dashboardDataFetching,
	} = useDashboardQuery(filters);
	const updateTransactionCategoryMutation = useUpdateTransactionsCategoryMutation();
	const syncAllPlaidItemsMutation = useSyncAllPlaidItemsMutation();

	// Memoize transaction from cache, pagedTransactions to store current page, and selectedTransaction based on selectedTransactionIds
	const transactions = useMemo(() => {
		return dashboardData?.transactions ?? [];
	}, [dashboardData]);

	const sortedTransactions = useMemo(() => {
		return sortTransactions(transactions, dashboardSortState);
	}, [transactions, dashboardSortState]);

	const pagedTransactions = useMemo(() => {
		return sortedTransactions.slice(dashboardPage * pageSize, dashboardPage * pageSize + pageSize);
	}, [sortedTransactions, dashboardPage]);

	const selectedTransactions = useMemo(() => {
		return transactions.filter((transaction) => selectedTransactionIds.includes(transaction.id));
	}, [transactions, selectedTransactionIds]);

	// Logic for determing whether to show loading spinner on table or just rendering a blocker to stop user action (e.g. for category update)
	const showInitialLoadingState =
		(dashboardDataLoading && !dashboardData?.transactions) || (categoriesLoading && !categories);

	const tableLocked =
		!showInitialLoadingState && (updateTransactionCategoryMutation.isPending || dashboardDataFetching);

	const pageLimit = useMemo(() => {
		return Math.ceil(transactions?.length / pageSize) - 1;
	}, [transactions]);

	useEffect(() => {
		if (transactions.length > 0 && dashboardPage > Math.ceil(transactions?.length / pageSize) - 1)
			setDashboardPage(pageLimit);
	}, [transactions]);

	// Resize the height of the filter menu on window resize
	useLayoutEffect(() => {
		if (showFilters && filtersRef.current) {
			filtersRef.current.style.maxHeight = `${filtersRef.current.scrollHeight}px`;
		} else if (filtersRef.current) {
			filtersRef.current.style.maxHeight = "0";
		}
	}, [showFilters, filters]);

	const onSorterClick = (column) => {
		let newDashboardSortState = {};
		if (dashboardSortState?.column === column) {
			if (dashboardSortState?.direction === "asc") newDashboardSortState = null;
			else newDashboardSortState = { column, direction: "asc" };
		} else {
			newDashboardSortState = { column, direction: "desc" };
		}

		setDashboardSortState(newDashboardSortState);
	};

	const handleSyncAllPlaidItems = () => {
		if (syncAllPlaidItemsMutation.isPending) return;

		syncAllPlaidItemsMutation.mutate(undefined, {
			onSuccess: (items) => {
				setNotification(formatPlaidSyncSuccessNotification(items));
			},
		});
	};

	return (
		<div className="relative flex flex-col grow rounded-2xl">
			{tableLocked && <div className="absolute z-20 backdrop-blur-[0.8px] w-full h-full"></div>}

			<div ref={tableRef} className="grow flex flex-col bg-white border border-slate-300 rounded-2xl">
				<div className="flex items-center justify-between px-5 py-3">
					<div className="flex gap-2">
						{selectedTransactions.length > 0 && (
							<>
								<button
									onClick={() => setSelectedTransactionIds([])}
									className="font-normal hover:bg-slate-50 border border-slate-200 rounded text-sm p-1"
								>
									<div className="w-4" style={{ padding: "0.2rem" }}>
										<img src="./close.svg" className="w-full" />
									</div>
									{/* Clear */}
								</button>
								<BulkActions
									transactions={transactions}
									categories={categories}
									selectedTransactionIds={selectedTransactionIds}
									setSelectedTransactionIds={setSelectedTransactionIds}
								/>
								<div className="w-[2px] bg-gray-300"></div>
							</>
						)}
						<span className="text-lg text-slate-600 font-semibold flex justify-start items-center">
							Transactions
						</span>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleSyncAllPlaidItems}
							disabled={syncAllPlaidItemsMutation.isPending}
							className="relative border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<span className={syncAllPlaidItemsMutation.isPending ? "opacity-0" : ""}>Sync</span>
							{syncAllPlaidItemsMutation.isPending && <ButtonSpinner />}
						</button>
						<button
							onClick={() => {
								setShowFilters(!showFilters);
							}}
							className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-1 border-slate-300 border rounded"
						>
							{showFilters ? "Hide Filters" : "Show Filters"}
						</button>
					</div>
				</div>
				<div
					ref={filtersRef}
					className={`${showFilters ? "mb-3" : "overflow-hidden"} relative transition-[max-height] duration-200`}
				>
					<div className="w-full px-5">
						<div className="border border-slate-300 rounded-lg p-2 flex justify-between items-center">
							<div className="flex flex-wrap gap-2">
								{filters.map((filter, index) => (
									<div
										key={index}
										className="border border-slate-200 py-1.5 px-2 rounded flex items-center gap-1 shrink-0"
									>
										<span className="text-slate-600 font-semibold">{filter.type}: </span>
										{filter.type === "Date" && (
											<span>{`${filter.start.month}/${filter.start.day}/${filter.start.year} to ${filter.end.month}/${filter.end.day}/${filter.end.year}`}</span>
										)}
										{filter.type === "Merchant" && <span>{filter.merchant}</span>}
										{filter.type === "Category" && (
											<span
												className="text-slate-600 px-1.5 rounded"
												style={{ backgroundColor: filter.category.color }}
											>
												{filter.category.name}
											</span>
										)}
										{filter.type === "Configuration" && <span>{filter.configuration}</span>}
										{filter.type === "Amount" && (
											<span>
												{filter.condition === "lessThan" && "Less Than"}
												{filter.condition === "equals" && "Equals"}
												{filter.condition === "greaterThan" && "Greater Than"} {filter.amount}
											</span>
										)}
										<button
											onClick={() => {
												const newFilters = [...filters];
												newFilters.splice(index, 1);
												setFilters(newFilters);
											}}
											className="hover:bg-slate-100 h-full"
										>
											<img className="w-3" src="./close.svg" />
										</button>
									</div>
								))}
							</div>
							<div className="shrink-0">
								<FilterButtons transactions={transactions} />
							</div>
						</div>
					</div>
				</div>
				<div className="bg-slate-100 py-3 px-4 w-full flex box-border">
					<div className="font-semibold w-[3%] flex justify-center items-center">
						<input
							checked={
								(transactions.length > 0 &&
									transactions.every((t) => selectedTransactionIds.includes(t.id))) ||
								false
							}
							onChange={(e) => {
								setSelectedTransactionIds((current) =>
									e.target.checked
										? Array.from(new Set([...current, ...transactions.map((t) => t.id)]))
										: current.filter((id) => !transactions.map((t) => t.id).includes(id)),
								);
							}}
							className="flex items-center justify-center bg-slate-100"
							type="checkbox"
						/>
					</div>
					<div className="font-semibold w-[11%] px-2 flex justify-between items-center">
						<span>Date</span>
						<TableSorter column={"date"} sortState={dashboardSortState} onSorterClick={onSorterClick} />
					</div>
					<div className="font-semibold w-[35%] px-2 flex justify-between items-center">
						<span>Merchant</span>
						<TableSorter column={"merchant"} sortState={dashboardSortState} onSorterClick={onSorterClick} />
					</div>
					<div className="font-semibold w-[20%] px-2 flex justify-between items-center">
						<span>Category</span>
						<TableSorter
							column={"categoryName"}
							sortState={dashboardSortState}
							onSorterClick={onSorterClick}
						/>
					</div>
					<div className="font-semibold w-[16%] px-2 flex justify-between items-center">
						<span>Configuration</span>
						<TableSorter
							column={"configurationName"}
							sortState={dashboardSortState}
							onSorterClick={onSorterClick}
						/>
					</div>
					<div className="font-semibold w-[11%] px-2 flex justify-between items-center">
						<span>Amount</span>
						<TableSorter column={"amount"} sortState={dashboardSortState} onSorterClick={onSorterClick} />
					</div>
					<div className="font-semibold w-[3%] flex justify-between items-center"></div>
				</div>
				<div className="flex flex-col grow">
					<div className="grow">
						{!showInitialLoadingState &&
							pagedTransactions?.map((transaction, index) => {
								const hasBottomBorder =
									index <
									(pageSize - 1 < transactions.length - 1 ? pageSize - 1 : transactions.length - 1);

								return (
									<div
										key={transaction.id}
										className={`${hasBottomBorder ? "border-b" : ""} border-slate-200 w-full flex items-center py-3 px-4 flex box-border`}
									>
										<div className="w-[3%] flex items-center justify-center">
											<input
												checked={selectedTransactionIds.includes(transaction.id) || false}
												onChange={(e) => {
													setSelectedTransactionIds((current) =>
														e.target.checked
															? [...current, transaction.id]
															: current.filter((id) => id !== transaction.id),
													);
												}}
												className="max-w-5 w-full"
												type="checkbox"
											/>
										</div>
										<div className={`${transaction.ignored ? "opacity-30" : ""} w-[11%] px-2`}>
											{transaction.date}
										</div>
										<div className={`${transaction.ignored ? "opacity-30" : ""} w-[35%] px-2`}>
											{transaction.merchant}
										</div>
										<div
											className={`${transaction.ignored ? "opacity-30" : ""} w-[20%] px-2 relative`}
										>
											<TransactionTableCategoryButton
												transaction={transaction}
												filters={filters}
												categories={categories}
												categoriesLoading={categoriesLoading}
												tableRef={tableRef}
											/>
										</div>
										<div className={`${transaction.ignored ? "opacity-30" : ""} w-[16%] px-2`}>
											{transaction.configurationName}
										</div>
										<div
											className={`${transaction.amount.toFixed(2).includes("-") ? "text-cGreen-dark" : ""} ${transaction.ignored ? "opacity-30" : ""} w-[11%] px-2`}
										>
											{transaction.amount.toFixed(2)}
										</div>
										<div className="w-[3%] flex justify-center">
											<TransactionMenu
												transaction={transaction}
												transactionId={transaction.id}
												ignored={transaction.ignored}
											/>
										</div>
									</div>
								);
							})}

						{showInitialLoadingState && (
							<div className="flex relative justify-center text-sm text-slate-300 items-center p-5 opacity-80">
								<ButtonSpinner />
							</div>
						)}
					</div>
					<Pagination
						page={dashboardPage}
						setPage={setDashboardPage}
						pageLimit={Math.ceil(transactions?.length / pageSize) - 1}
					/>
				</div>
			</div>
		</div>
	);
};

export default TransactionTable;
