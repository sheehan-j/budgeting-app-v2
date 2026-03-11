import PropTypes from "prop-types";

const CSVSymbolOption = ({ symbolMeaning, firstQuestion, firstOnChange, secondQuestion, secondOnChange }) => {
	return (
		<div>
			<div className="flex justify-between">
				<label>{firstQuestion}</label>
				<input
					className="accent-cGreen-light text-white bg-white"
					type="checkbox"
					checked={symbolMeaning !== null}
					onChange={firstOnChange}
				/>
			</div>
			{symbolMeaning && (
				<div className="mt-1 flex justify-between">
					<label>{secondQuestion}</label>
					<select
						className="border border-slate-300 text-sm rounded p-1 bg-white"
						value={symbolMeaning}
						onChange={secondOnChange}
					>
						<option value="charge">Charge</option>
						<option value="credit">Credit</option>
					</select>
				</div>
			)}
		</div>
	);
};

CSVSymbolOption.propTypes = {
	symbolMeaning: PropTypes.string,
	firstQuestion: PropTypes.string,
	firstOnChange: PropTypes.func,
	secondQuestion: PropTypes.string,
	secondOnChange: PropTypes.func,
};

export default CSVSymbolOption;
