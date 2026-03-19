const CategoriesSettings = () => {
	return (
		<div className="grow flex flex-col">
			<div className="grow overflow-y-auto p-6">
				<div className="text-lg text-slate-600 font-semibold">Categories</div>

				{/* CATEGORIES TABLE */}
				<div className="flex rounded-lg overflow-hidden">
					{/* CATEGORIES TABLE COLUMNS */}
					<div className="grow flex bg-gray-50">
						<div className="px-3 min-h-11 py-1 font-semibold flex justify-start items-center">Name</div>
					</div>
					<div className="flex w-[25%] bg-gray-100">
						<div className="px-3 min-h-11 py-1 font-semibold flex justify-start items-center">Position</div>
					</div>
					{/* <div className="grow shrink-0 font-semibold">Name</div>
						<div className="font-semibold">Position</div> */}
				</div>
			</div>
		</div>
	);
};

export default CategoriesSettings;
