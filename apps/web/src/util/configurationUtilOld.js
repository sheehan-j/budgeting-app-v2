import supabase from "../config/supabaseClient";

export const getConfigurations = async () => {
	try {
		let { data, error } = await supabase.from("configurations").select("*");
		const configurations = [...data];
		if (error) throw error;

		({ data, error } = await supabase.from("configurations_to_types").select("*"));
		const configurationsToTypes = [...data];
		if (error) throw error;

		// Process each row of the DB into objects containing type and rowNum and group them by configurationName
		const configurationMap = {};
		configurationsToTypes.forEach((configuration) => {
			if (!configurationMap[configuration.configurationName])
				configurationMap[configuration.configurationName] = [];

			configurationMap[configuration.configurationName].push({
				typeName: configuration.typeName,
				rowNum: configuration.rowNum,
			});
		});

		// Create a new object for each configuration and add the options from the configurationMap
		const newConfigurations = [];
		configurations.forEach((configuration) => {
			if (!configurationMap[configuration.name]) configurationMap[configuration.name] = [];
			const newConfiguration = {
				configurationName: configuration.name,
				...configuration,
				options: configurationMap[configuration.name],
			};
			delete newConfiguration.name; // Delete the "name" field that comes from the DB table
			newConfigurations.push(newConfiguration);
		});

		newConfigurations.sort((a, b) => a.configurationName.localeCompare(b.configurationName));

		return newConfigurations;
	} catch (error) {
		alert("Could not fetch configurations.");
		return [];
	}
};
