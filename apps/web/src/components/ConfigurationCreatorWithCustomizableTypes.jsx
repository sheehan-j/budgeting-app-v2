import { useEffect, useState } from "react";
import supabase from "../config/supabaseClient";
import { getConfigurations } from "../util/configurationUtil";

const ConfigurationCreator = () => {
	const [configurations, setConfigurations] = useState([]);
	const [activeConfiguration, setActiveConfiguration] = useState(null);
	const [types, setTypes] = useState([]);
	const [selectedType, setSelectedType] = useState("");
	const [newConfigurationName, setNewConfigurationName] = useState("");

	// Negative/positive sign information
	// const [hasMinusSymbols, setHasMinusSymbols] = useState(false);
	// const [minusSymbolMeaning, setMinusSymbolMeaning] = useState("charge");
	// const [hasPlusSymbols, setHasPlusSymbols] = useState(false);
	// const [plusSymbolMeaning, setPlusSymbolMeaning] = useState("credit");
	// const [hasNoSymbols, setHasNoSymbols] = useState(false);
	// const [noSymbolMeaning, setNoSymbolMeaning] = useState("charge");

	const loadData = async () => {
		let { data, error } = await supabase.from("types").select("*");
		if (error) alert("Could not fetch available data types.");
		else setTypes(data);

		if (!error) {
			const newConfigurations = await getConfigurations();
			console.log(newConfigurations);
			setConfigurations(newConfigurations);
		} else {
			alert("Could not fetch configurations.");
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleClickConfiguration = (configurationName) => {
		setActiveConfiguration(
			configurations?.find((configuration) => configuration.configurationName === configurationName)
		);
	};

	const handleCreateConfiguration = async () => {
		if (configurations?.some((configuration) => configuration.configurationName === newConfigurationName)) {
			alert("Configuration name already exists.");
			return;
		}

		const { error } = await supabase.from("configurations").insert([{ name: newConfigurationName }]);
		if (error) {
			alert("Could not create configuration.");
			return;
		}

		loadData();
	};

	const handleDeleteConfiguration = async (configurationName) => {
		let { error } = await supabase
			.from("configurations_to_types")
			.delete()
			.eq("configurationName", configurationName);
		if (error) {
			alert("Could not delete configuration.");
			return;
		}

		({ error } = await supabase.from("configurations").delete().eq("name", configurationName));
		if (error) {
			alert(error.details);
			alert("Could not delete configuration.");
			return;
		}

		await loadData();

		if (activeConfiguration.configurationName === configurationName) setActiveConfiguration({});
	};

	const handleSaveConfiguration = async () => {
		try {
			// Format data for the configuration table (contains plus/minus/no symbol meanings)
			// TODO: Add error handling here to check that a minimum of two checkboxes are selected/there aren't two selections for charge or credit
			const formattedConfiguration = {
				name: activeConfiguration.configurationName,
				...activeConfiguration,
			};

			// Delete these two fields - not used in the DB table for configurations
			delete formattedConfiguration.configurationName;
			delete formattedConfiguration.options;

			let { error } = await supabase.from("configurations").upsert(formattedConfiguration);
			if (error) throw error;

			let formattedOptions = [...activeConfiguration.options];
			formattedOptions = formattedOptions.map((option) => ({
				configurationName: activeConfiguration.configurationName,
				typeName: option.typeName,
				rowNum: parseInt(option.rowNum),
			}));
			({ error } = await supabase
				.from("configurations_to_types")
				.delete()
				.eq("configurationName", activeConfiguration.configurationName));
			if (error) throw error;

			({ error } = await supabase.from("configurations_to_types").upsert(formattedOptions));
			if (error) throw error;

			loadData();
		} catch (error) {
			alert("Could not save configuration.");
		}
	};

	const handleAddType = () => {
		if (selectedType === "") {
			alert("Please select a type to add.");
			return;
		}

		const newActiveConfiguration = {
			...activeConfiguration,
			options: activeConfiguration.options
				? [...activeConfiguration.options, { typeName: selectedType, rowNum: "" }]
				: [{ typeName: selectedType, rowNum: "" }],
		};

		setSelectedType("");
		setActiveConfiguration(newActiveConfiguration);
	};

	const handleDeleteType = (type) => {
		const newActiveConfiguration = {
			...activeConfiguration,
			options: activeConfiguration.options.filter((option) => option.typeName !== type),
		};
		setActiveConfiguration(newActiveConfiguration);
	};

	return (
		<section className="flex gap-2">
			<section className="flex flex-col gap-2">
				{configurations?.map((configuration) => (
					<div className="flex" key={configuration.configurationName}>
						<button
							className="border grow p-1"
							onClick={() => {
								handleClickConfiguration(configuration.configurationName);
							}}
						>
							{configuration.configurationName}
						</button>
						<button
							className="bg-red-100"
							onClick={() => handleDeleteConfiguration(configuration.configurationName)}
						>
							X
						</button>
					</div>
				))}
				<div className="border p-2 flex flex-col">
					<input
						className="border p-1 text-sm"
						type="text"
						placeholder="Configuration Name"
						value={newConfigurationName}
						onChange={(e) => setNewConfigurationName(e.target.value)}
					/>
					<button className="bg-green-100" onClick={handleCreateConfiguration}>
						Create
					</button>
				</div>
			</section>
			<section className="border p-2">
				{activeConfiguration && (
					<>
						<div>
							<select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
								<option disabled value="">
									Select a type
								</option>
								{types
									?.filter(
										(type) =>
											!activeConfiguration?.options?.some(
												(option) => option.typeName === type.name
											)
									)
									.map((type) => (
										<option value={type.name} key={type.name}>
											{type.name}
										</option>
									))}
							</select>
							<button className="bg-blue-100" onClick={handleAddType}>
								Add
							</button>
						</div>

						<div id="configOptionsContainer" className="flex flex-col gap-3">
							{activeConfiguration?.options?.map((option) => (
								<div key={option.typeName} className="flex gap-2">
									<p>{option.typeName}</p>
									<input
										type="text"
										className="border"
										value={option.rowNum}
										onChange={(e) => {
											const updatedOptions = activeConfiguration.options.map((optionToUpdate) => {
												return optionToUpdate.typeName === option.typeName
													? { ...optionToUpdate, rowNum: e.target.value }
													: optionToUpdate;
											});
											setActiveConfiguration({ ...activeConfiguration, options: updatedOptions });
										}}
									/>
									<button className="bg-red-100" onClick={() => handleDeleteType(option.typeName)}>
										Delete
									</button>
								</div>
							))}
							<div>
								<div>
									<label>{"Does your CSV have minus (-) symbols?"}</label>
									<input
										type="checkbox"
										checked={activeConfiguration?.minusSymbolMeaning !== null}
										onChange={(e) => {
											setActiveConfiguration({
												...activeConfiguration,
												minusSymbolMeaning: e.target.checked ? "charge" : null,
											});
										}}
									/>
								</div>
								{activeConfiguration?.minusSymbolMeaning && (
									<div>
										<label>{"What does the minus symbol signify?"}</label>
										<select
											value={activeConfiguration?.minusSymbolMeaning}
											onChange={(e) =>
												setActiveConfiguration({
													...activeConfiguration,
													minusSymbolMeaning: e.target.value,
												})
											}
										>
											<option value="charge">Charge</option>
											<option value="credit">Credit</option>
										</select>
									</div>
								)}
							</div>

							<div>
								<div>
									<label>{"Does your CSV have plus (+) symbols?"}</label>
									<input
										type="checkbox"
										checked={activeConfiguration?.plusSymbolMeaning !== null}
										onChange={(e) => {
											setActiveConfiguration({
												...activeConfiguration,
												plusSymbolMeaning: e.target.checked ? "credit" : null,
											});
										}}
									/>
								</div>
								{activeConfiguration?.plusSymbolMeaning && (
									<div>
										<label>{"What does the plus symbol signify?"}</label>
										<select
											value={activeConfiguration?.plusSymbolMeaning}
											onChange={(e) =>
												setActiveConfiguration({
													...activeConfiguration,
													plusSymbolMeaning: e.target.value,
												})
											}
										>
											<option value="charge">Charge</option>
											<option value="credit">Credit</option>
										</select>
									</div>
								)}
							</div>

							<div>
								<div>
									<label>{"Does your CSV have transactions without symbols?"}</label>
									<input
										type="checkbox"
										checked={activeConfiguration?.noSymbolMeaning !== null}
										onChange={(e) => {
											setActiveConfiguration({
												...activeConfiguration,
												noSymbolMeaning: e.target.checked ? "credit" : null,
											});
										}}
									/>
								</div>
								{activeConfiguration?.noSymbolMeaning && (
									<div>
										<label>{"What does these transactions signify?"}</label>
										<select
											value={activeConfiguration?.noSymbolMeaning}
											onChange={(e) =>
												setActiveConfiguration({
													...activeConfiguration,
													noSymbolMeaning: e.target.value,
												})
											}
										>
											<option value="charge">Charge</option>
											<option value="credit">Credit</option>
										</select>
									</div>
								)}
							</div>
						</div>

						<div>
							<button className="bg-blue-100" onClick={handleSaveConfiguration}>
								Save
							</button>
						</div>
					</>
				)}
			</section>
		</section>
	);
};

export default ConfigurationCreator;
