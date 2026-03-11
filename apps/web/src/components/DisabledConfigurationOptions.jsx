const DisabledConfigurationOptions = () => {
	return (
		<>
			<div className="flex flex-col grow px-8 pt-8 pb-4 opacity-35 overflow-y-scroll">
				<div className="grow">
					<div className="mb-8">
						<div className="text-slate-500 mb-1">Configuration Name</div>
						<input className="w-1/2" type="text" disabled />
					</div>
					<div id="configOptionsContainer" className="mb-6">
						<div className="text-slate-500 text-xs mb-1 font-light italic">
							For date, amount, and merchant, enter the column number corresponding to these fields in
							your CSV.
						</div>
						<div className="flex flex-col gap-3">
							<div className="flex flex-col">
								<div className="text-slate-500 mb-1">Date</div>
								<input type="text" className="w-1/3" disabled />
							</div>

							<div className="flex flex-col">
								<div className="text-slate-500 mb-1">Amount</div>
								<input type="text" className="w-1/3" disabled />
							</div>

							<div className="flex flex-col">
								<div className="text-slate-500 mb-1">Merchant</div>
								<input type="text" className="w-1/3" disabled />
							</div>
						</div>
					</div>
					<div className="flex justify-between mb-6">
						<label>{"Does your CSV have a header?"}</label>
						<input type="checkbox" disabled />
					</div>
					<div className="flex flex-col gap-4">
						<div className="flex justify-between">
							<label>{"Does your CSV have minus (-) symbols"}</label>
							<input type="checkbox" disabled />
						</div>

						<div className="flex justify-between">
							<label>{"Does your CSV have plus (+) symbols?"}</label>
							<input type="checkbox" disabled />
						</div>

						<div className="flex justify-between">
							<label>{"Does your CSV have transactions without symbols?"}</label>
							<input type="checkbox" disabled />
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default DisabledConfigurationOptions;
