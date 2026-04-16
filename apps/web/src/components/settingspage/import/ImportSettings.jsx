import { useRef, useState } from "react";
import ButtonSpinner from "../../common/ButtonSpinner";
import { useDataStore } from "../../../util/dataStore";
import { useImportAppleCsvMutation } from "../../../mutations/useImportAppleCsvMutation";

const formatIsoDateLabel = (value) => {
	if (!value) return null;
	const [year, month, day] = value.split("-");
	if (!year || !month || !day) return value;
	return `${month}/${day}/${year}`;
};

const formatImportSummary = (response) => {
	const parts = [`${response.insertedCount} imported`];

	if (response.overlapSkippedCount > 0) {
		parts.push(`${response.overlapSkippedCount} overlapping skipped`);
	}

	if (response.duplicateSkippedCount > 0) {
		parts.push(`${response.duplicateSkippedCount} duplicates skipped`);
	}

	const rangeStart = formatIsoDateLabel(response.importedRangeStart);
	const rangeEnd = formatIsoDateLabel(response.importedRangeEnd);
	const rangeLabel = rangeStart && rangeEnd ? ` (${rangeStart} - ${rangeEnd})` : "";

	return `${response.accountName}: ${parts.join(", ")}${rangeLabel}.`;
};

const ImportSettings = () => {
	const setNotification = useDataStore((state) => state.setNotification);
	const importAppleCsvMutation = useImportAppleCsvMutation();
	const fileInputRef = useRef(null);
	const [uploading, setUploading] = useState(false);

	const handleImportClick = () => {
		if (uploading) return;
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event) => {
		const input = event.target;
		const file = input.files?.[0];
		input.value = "";

		if (!file || importAppleCsvMutation.isPending) return;

		setUploading(true);

		try {
			const csvText = await file.text();

			importAppleCsvMutation.mutate(
				{
					csvText,
					fileName: file.name,
				},
				{
					onSuccess: (response) => {
						setNotification({
							type: "success",
							message: formatImportSummary(response),
						});
					},
					onError: (error) => {
						setNotification({
							type: "error",
							message: error instanceof Error ? error.message : "Could not import Apple transactions.",
						});
					},
					onSettled: () => {
						setUploading(false);
					},
				},
			);
		} catch (error) {
			setUploading(false);
			setNotification({
				type: "error",
				message: error instanceof Error ? error.message : "Could not read this CSV file.",
			});
		}
	};

	return (
		<div className="grow flex flex-col p-6 overflow-y-auto">
			<h2 className="text-lg font-semibold text-slate-800">Import</h2>
			<p className="text-sm text-slate-500 mt-1">
				Import transactions for institutions not supported by Plaid via exported CSV files
			</p>

			<div className="mt-6 border border-slate-200 rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-base font-medium text-slate-800">Apple Card</h3>
					</div>
					<div>
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={handleFileChange}
						/>
						<button
							onClick={handleImportClick}
							disabled={uploading}
							className="relative border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<span className={uploading ? "opacity-0" : ""}>Import CSV</span>
							{uploading && <ButtonSpinner />}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ImportSettings;
