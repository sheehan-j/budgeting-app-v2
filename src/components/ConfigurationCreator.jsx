import { useEffect, useState } from "react";
import DisabledConfigurationOptions from "./DisabledConfigurationOptions";
import ButtonSpinner from "./ButtonSpinner";
import supabase from "../config/supabaseClient";
import CSVColNumOption from "./CSVColNumOption";
import ErrorMessage from "./ErrorMessage";
import { useDataStore } from "../util/dataStore";

const ConfigurationCreator = () => {
	const { configurations, configurationsLoading, fetchConfigurations, session } = useDataStore((state) => ({
		configurations: state.configurations,
		setConfigurations: state.setConfigurations,
		configurationsLoading: state.configurationsLoading,
		fetchConfigurations: state.fetchConfigurations,
		session: state.session,
	}));
	const [activeConfiguration, setActiveConfiguration] = useState(null);
	const [newConfigurationName, setNewConfigurationName] = useState("");
	const [newConfigurationError, setNewConfigurationError] = useState(null);
	const [hasHeader, setHasHeader] = useState(false);
	const [saveConfigurationErrors, setSaveConfigurationErrors] = useState([]);
	const [successVisible, setSuccessVisible] = useState(false);
	const [loading, setLoading] = useState({
		save: false,
		delete: false,
	});

	const emptyConfiguration = {
		name: null,
		merchantColNum: null,
		chargesColNum: null,
		creditsColNum: null,
		chargesSymbol: "minus",
		creditsSymbol: "none",
		dateColNum: null,
		headerRows: null,
	};

	useEffect(() => {
		if (configurations === null) fetchConfigurations();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleClickConfiguration = (configurationName) => {
		if (Object.values(loading).some((value) => value)) return;

		const target = configurations?.find((configuration) => configuration.name === configurationName);
		setHasHeader(target.headerRows !== null);
		setActiveConfiguration(target);
		setNewConfigurationName("");
	};

	const handleCreateConfiguration = async () => {
		if (Object.values(loading).some((value) => value)) return;

		const empty = newConfigurationName === "";
		const tooLong = newConfigurationName.length > 25;
		const alreadyExists = configurations?.some((configuration) => configuration.name === newConfigurationName);
		if (empty || tooLong || alreadyExists) {
			if (empty) setNewConfigurationError("Configuration name cannot be empty.");
			else if (tooLong) setNewConfigurationError("Configuration name cannot be longer than 25 characters.");
			else if (alreadyExists) setNewConfigurationError("Configuration name already exists.");

			setTimeout(() => {
				setNewConfigurationError(null);
			}, 4000);
			return;
		}

		const newConfiguration = {
			...emptyConfiguration,
			name: newConfigurationName,
		};

		setNewConfigurationName("");
		setActiveConfiguration(newConfiguration);
	};

	const handleDeleteConfiguration = async () => {
		if (Object.values(loading).some((value) => value)) return;

		setLoading({ ...loading, delete: true });

		// Check if the active configuration is one that has been "created" but not saved, then we can just clear the active configuration
		if (configurations?.find((configuration) => configuration.name === activeConfiguration.name) === undefined) {
			setLoading({ ...loading, delete: false });
			setActiveConfiguration(null);
			return;
		}

		const { error } = await supabase.from("configurations").delete().eq("name", activeConfiguration.name);
		if (error) {
			setLoading({ ...loading, delete: false });
			setSaveConfigurationErrors(["Could not delete configuration."]);
			return;
		}

		fetchConfigurations();

		setActiveConfiguration(null);
		setLoading({ ...loading, delete: false });
	};

	const handleSaveConfiguration = async () => {
		if (Object.values(loading).some((value) => value)) return;

		setSaveConfigurationErrors([]);
		setLoading({ ...loading, save: true });

		const errors = [];
		if (activeConfiguration.name === null) errors.push("Configuration name cannot be empty.");
		if (activeConfiguration.name.length > 25)
			errors.push("Configuration name cannot be longer than 25 characters.");

		if (activeConfiguration.dateColNum === null) errors.push("Date column number cannot be empty.");
		else if (isNaN(activeConfiguration.dateColNum)) errors.push("Date column number must be a number.");

		if (activeConfiguration.chargesColNum === null) errors.push("Merchant column number cannot be empty.");
		else if (isNaN(activeConfiguration.chargesColNum)) errors.push("Merchant column number must be a number.");

		if (activeConfiguration.creditsColNum === null) errors.push("Merchant column number cannot be empty.");
		else if (isNaN(activeConfiguration.creditsColNum)) errors.push("Merchant column number must be a number.");

		if (activeConfiguration.creditsSymbol === activeConfiguration.chargesSymbol)
			errors.push("Charges and credits cannot have the same symbols.");

		// Check for errors before making Supabase call
		if (errors.length > 0) {
			setSaveConfigurationErrors(errors);
			setLoading({ ...loading, save: false });
			return;
		}

		const { error } = await supabase
			.from("configurations")
			.upsert({ ...activeConfiguration, userId: session.user.id });
		if (error) {
			setSaveConfigurationErrors(["Could not save configuration."]);
			return;
		}

		setNewConfigurationName("");
		fetchConfigurations();

		setLoading({ ...loading, save: false });
		setSuccessVisible(true);
		setTimeout(() => {
			setSuccessVisible(false);
		}, 2000);
	};

	return (
		<div className="w-full h-full flex bg-white rounded-2xl">
			<section className="flex flex-col w-3/12 border-r-2">
				<div className="grow overflow-y-auto p-6">
					<div className="text-lg text-slate-600 font-semibold mb-3">Configurations</div>
					<div className="flex flex-col gap-4">
						{!configurationsLoading &&
							configurations?.map((configuration, index) => (
								<div className="flex" key={index}>
									<button
										className={`${
											activeConfiguration?.name === configuration.name
												? "border-cGreen text-cGreen-dark font-medium"
												: "border-slate-300"
										} border rounded-lg grow p-2`}
										onClick={() => {
											handleClickConfiguration(configuration.name);
										}}
									>
										{configuration.name}
									</button>
								</div>
							))}
						{configurationsLoading && (
							<>
								<div className="rounded-lg animate-pulse bg-gray-100 grow p-2">
									<div className="h-4"></div>
								</div>
								<div className="rounded-lg animate-pulse bg-gray-100 grow p-2">
									<div className="h-4"></div>
								</div>
								<div className="rounded-lg animate-pulse bg-gray-100 grow p-2">
									<div className="h-4"></div>
								</div>
							</>
						)}
					</div>
				</div>
				<div className="border-t border-slate-300 px-8 pb-6 pt-4">
					<div className="border border-slate-300 rounded p-3 flex flex-col gap-2">
						<input
							className="border border-slate-300 rounded py-1 px-2 text-sm"
							type="text"
							placeholder="New Configuration Name"
							value={newConfigurationName}
							onChange={(e) => {
								setNewConfigurationError(null);
								setNewConfigurationName(e.target.value);
							}}
						/>
						<button
							className="bg-cGreen-light hover:bg-cGreen-lightHover border border-slate-300 rounded text-sm text-slate-700 p-1"
							onClick={handleCreateConfiguration}
						>
							Create
						</button>
						<ErrorMessage error={newConfigurationError} />
					</div>
				</div>
			</section>
			<section className="flex flex-col grow">
				{activeConfiguration ? (
					<>
						<div className="flex flex-col grow px-8 pt-8 pb-4 overflow-y-auto">
							<div className="mb-8">
								<div className="text-slate-500 mb-1">Configuration Name</div>
								<input
									className="w-1/2"
									type="text"
									value={activeConfiguration?.name || ""}
									onChange={(e) => {
										setActiveConfiguration({
											...activeConfiguration,
											name: e.target.value !== "" ? e.target.value : null,
										});
									}}
								/>
							</div>
							<div id="configOptionsContainer" className="mb-6">
								<div className="text-slate-500 text-xs mb-1 font-light italic">
									For date, amount, and merchant, enter the column number corresponding to these
									fields in your CSV.
								</div>
								<div className="flex flex-col gap-5">
									<CSVColNumOption
										name={"Date"}
										value={activeConfiguration?.dateColNum?.toString() || ""}
										onChange={(e) => {
											setActiveConfiguration({
												...activeConfiguration,
												dateColNum: e.target.value !== "" ? e.target.value : null,
											});
										}}
									/>

									<CSVColNumOption
										name={"Merchant"}
										value={activeConfiguration?.merchantColNum?.toString() || ""}
										onChange={(e) => {
											setActiveConfiguration({
												...activeConfiguration,
												merchantColNum: e.target.value !== "" ? e.target.value : null,
											});
										}}
									/>

									<div>
										<CSVColNumOption
											name={"Charges"}
											value={activeConfiguration?.chargesColNum?.toString() || ""}
											onChange={(e) => {
												setActiveConfiguration({
													...activeConfiguration,
													chargesColNum: e.target.value !== "" ? e.target.value : null,
												});
											}}
										/>
										<div className="mt-2 flex justify-between">
											<label>{"Do charges have symbols?"}</label>
											<select
												className="border border-slate-300 text-sm rounded p-1 bg-white"
												value={activeConfiguration?.chargesSymbol || ""}
												onChange={(e) =>
													setActiveConfiguration({
														...activeConfiguration,
														chargesSymbol: e.target.value,
													})
												}
											>
												<option value="none">No Symbol</option>
												<option value="minus">{"Minus (-)"}</option>
												<option value="plus">{"Plus (+)"}</option>
											</select>
										</div>
									</div>

									<div>
										<CSVColNumOption
											name={"Credits (often in same column as charges)"}
											value={activeConfiguration?.creditsColNum?.toString() || ""}
											onChange={(e) => {
												setActiveConfiguration({
													...activeConfiguration,
													creditsColNum: e.target.value !== "" ? e.target.value : null,
												});
											}}
										/>
										<div className="mt-2 flex justify-between">
											<label>{"Do credits have symbols?"}</label>
											<select
												className="border border-slate-300 text-sm rounded p-1 bg-white"
												value={activeConfiguration?.creditsSymbol || ""}
												onChange={(e) =>
													setActiveConfiguration({
														...activeConfiguration,
														creditsSymbol: e.target.value,
													})
												}
											>
												<option value="none">No Symbol</option>
												<option value="minus">{"Minus (-)"}</option>
												<option value="plus">{"Plus (+)"}</option>
											</select>
										</div>
									</div>
								</div>
							</div>
							<div className="flex flex-col gap-2 mb-6">
								<div className="flex justify-between">
									<label>{"Does your CSV have a header?"}</label>
									<input
										className="accent-cGreen-light text-white bg-white"
										type="checkbox"
										checked={hasHeader}
										onChange={(e) => {
											setHasHeader(e.target.checked);
											setActiveConfiguration({
												...activeConfiguration,
												headerRows: e.target.checked ? 1 : null,
											});
										}}
									/>
								</div>
								{hasHeader && (
									<CSVColNumOption
										name={"How many rows are in the header? (these rows will be ignored)"}
										value={activeConfiguration?.headerRows?.toString() || ""}
										onChange={(e) => {
											setActiveConfiguration({
												...activeConfiguration,
												headerRows: e.target.value !== "" ? e.target.value : null,
											});
										}}
									/>
								)}
							</div>
							<div className={`${saveConfigurationErrors?.length > 0 ? "mt-3" : ""}`}>
								<ErrorMessage errors={saveConfigurationErrors} />
							</div>
						</div>

						<div className="border-t border-slate-300 flex justify-between px-8 py-4">
							<button
								className="relative bg-red-100 py-1 px-2 bg-cGreen-light border border-slate-300 rounded text-sm text-slate-700 p-1"
								onClick={handleDeleteConfiguration}
							>
								<span className={`${loading.delete ? "opacity-0" : ""}`}>Delete</span>
								{loading.delete && <ButtonSpinner />}
							</button>
							<div className="flex items-center gap-2">
								{successVisible && (
									<div className="text-xs text-cGreen-dark">Configuration saved successfully!</div>
								)}
								<button
									className="relative bg-blue-100 py-1 px-2 bg-cGreen-light border border-slate-300 rounded text-sm text-slate-700 p-1"
									onClick={handleSaveConfiguration}
								>
									<span className={`${loading.save ? "opacity-0" : ""}`}>Save</span>
									{loading.save && <ButtonSpinner />}
								</button>
							</div>
						</div>
					</>
				) : (
					<DisabledConfigurationOptions />
				)}
			</section>
		</div>
	);
};

export default ConfigurationCreator;
