import { useLayoutEffect, useRef, useState } from "react";
import { defaultFilter } from "../../constants/Filters";
import { useCurrentDashboardQuery } from "../../queries/useCurrentDashboardQuery";
import DashboardStatsCategory from "./DashboardStatsCategory";

const DashboardStats = () => {
	const { data: dashboardData, isLoading: dashboardLoading } = useCurrentDashboardQuery();
	const dashboardStats = dashboardData?.stats ?? null;

	const showInitialLoadingState = dashboardLoading && !dashboardData;

	const [showAllCategories, setShowAllCategories] = useState(false);
	const extraCategoriesRef = useRef(null);
	const [extraCategoriesHeight, setExtraCategoriesHeight] = useState(0);

	useLayoutEffect(() => {
		if (!extraCategoriesRef.current) return;

		const measureHeight = () => {
			setExtraCategoriesHeight(extraCategoriesRef.current?.scrollHeight ?? 0);
		};

		measureHeight();

		if (typeof ResizeObserver !== "undefined") {
			const resizeObserver = new ResizeObserver(() => {
				measureHeight();
			});

			resizeObserver.observe(extraCategoriesRef.current);
			return () => resizeObserver.disconnect();
		}

		window.addEventListener("resize", measureHeight);
		return () => window.removeEventListener("resize", measureHeight);
	}, [dashboardStats?.categories]);

	return (
		<div className="w-full flex gap-3">
			<div className="py-6 pl-6 pr-12 flex flex-col justify-end bg-white border border-slate-300 rounded-2xl">
				{/* {REAL STATS} */}
				{!showInitialLoadingState && dashboardStats && (
					<>
						{/* {SPENDING FOR NORMAL CATEGORIES} */}
						{dashboardStats.specialCaseCategory === false && (
							<>
								{JSON.stringify(dashboardStats.filters) === JSON.stringify([{ ...defaultFilter }]) ? (
									<>
										<div className="text-sm text-slate-700 font-semibold">
											{dashboardStats?.spending?.title}
										</div>
										<div className="text-4xl font-bold text-cGreen-dark">
											{dashboardStats?.spending?.amount?.toFixed(2)}
										</div>
									</>
								) : (
									<>
										<div className="text-sm text-slate-700 font-semibold">
											Spending
											<span className="text-xs text-slate-500 font-normal italic">
												{" (filtered)"}
											</span>
										</div>
										<div className="text-4xl font-bold text-cGreen-dark">
											{dashboardStats?.spending?.amount?.toFixed(2)}
										</div>
									</>
								)}
							</>
						)}
						{dashboardStats.specialCaseCategory === true && (
							<>
								{/* {SPENDING FOR SPECIAL CASE CATEGORIES (INCOME, CREDITS/PAYMENTS)} */}
								<div className="text-sm text-slate-700 font-semibold mb-1 flex items-center justify-start">
									<span
										className="font-medium py-0.5 px-1 rounded mr-1"
										style={{
											backgroundColor: dashboardStats.category.colorLight,
											borderWidth: "1px",
											borderColor: dashboardStats.category.colorDark,
										}}
									>
										{dashboardStats.category.name}
									</span>
									Total
								</div>
								<div className="text-4xl font-bold text-cGreen-dark">
									{dashboardStats?.spending?.amount?.toFixed(2)}
								</div>
							</>
						)}
					</>
				)}

				{/* {SKELETON LOADER} */}
				{showInitialLoadingState && (
					<>
						<div className="w-24 bg-slate-200 animate-pulse rounded h-4 mb-2"></div>
						<div className="w-32 bg-cGreen-light animate-pulse rounded h-8"></div>
					</>
				)}
			</div>
			<div className="px-6 pb-6 pt-5 flex flex-col grow text-slate-700 justify-center bg-white border border-slate-300 rounded-2xl">
				{showInitialLoadingState && (
					<>
						<div className="bg-slate-200 animate-pulse w-32 rounded h-4 mb-2"></div>
						<div className="flex flex-col gap-2">
							<div className="flex flex-col gap-1">
								<div className="w-full flex justify-between items-center mb-1">
									<div className="bg-slate-200 animate-pulse w-28 rounded h-3"></div>
									<div className="bg-slate-200 animate-pulse w-12 rounded h-3"></div>
								</div>
								<div className="h-2 w-full bg-slate-200 animate-pulse rounded-3xl overflow-hidden">
									<div className="h-full"></div>
								</div>
							</div>
						</div>
					</>
				)}
				{!showInitialLoadingState && dashboardStats && (
					<>
						<div className="flex justify-between items-center text-lg font-semibold mb-1.5">
							{/* TOP CATEGORIES LABEL */}
							<span>
								Categorical Spending
								{JSON.stringify(dashboardStats.filters) !== JSON.stringify([{ ...defaultFilter }]) && (
									<span className="text-xs text-slate-500 font-normal italic">{" (filtered)"}</span>
								)}
							</span>
							{/* TOGGLE SHOW MORE/LESS BUTTON */}
							{dashboardStats?.categories?.length > 3 && (
								<button
									onClick={() => setShowAllCategories(!showAllCategories)}
									className="border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-normal px-2 py-0.5 border-slate-300 border rounded"
								>
									{showAllCategories ? "Show Less" : "Show More"}
								</button>
							)}
						</div>
						{dashboardStats?.categories?.length == 0 && (
							<div className="text-slate-500 opacity-75">No transactions found under current filters</div>
						)}
						<div className="flex flex-col">
							{/* TOP 3 CATEGORIES (ALWAYS DISPLAYED) */}
							{dashboardStats?.categories?.slice(0, 3).map((category, index) => (
								<span key={category.name} className={`${index < 2 ? "mb-2" : ""}`}>
									<DashboardStatsCategory key={category.name} category={category} />
								</span>
							))}

							{/* ANY CATEGORIES BEYOND THE TOP 3 (HIDDEN BY DEFAULT) */}
							<div
								className="overflow-hidden transition-[max-height] duration-200"
								style={{
									maxHeight: showAllCategories ? `${extraCategoriesHeight}px` : "0px",
								}}
							>
								<div
									ref={extraCategoriesRef}
									className="flex flex-col gap-2 pt-2"
								>
									{dashboardStats?.categories?.length > 3 && (
										<>
											{dashboardStats?.categories
												?.slice(3, dashboardStats?.categories?.length)
												.map((category) => (
													<DashboardStatsCategory key={category.name} category={category} />
												))}
										</>
									)}
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default DashboardStats;
