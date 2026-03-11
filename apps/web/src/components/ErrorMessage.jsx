import PropTypes from "prop-types";
import { Fragment } from "react";

const ErrorMessage = ({ error, errors }) => {
	return (
		<>
			{errors?.length > 0 && (
				<div
					className="w-full px-1 py-0.5 bg-red-50 text-xs border border-red-300 rounded text-red-400 overflow-y-auto"
					style={{ maxHeight: "4em" }}
				>
					{errors.map((error, index) => (
						<Fragment key={index}>
							<span>Error: {error}</span>
							<br />
						</Fragment>
					))}
				</div>
			)}
			{error && !errors && (
				<div className="w-full px-1 py-0.5 bg-red-50 text-xs border border-red-300 rounded text-red-400">
					Error: {error}
				</div>
			)}
		</>
	);
};

ErrorMessage.propTypes = {
	error: PropTypes.string,
	errors: PropTypes.array,
};

export default ErrorMessage;
