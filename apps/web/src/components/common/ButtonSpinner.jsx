import { Oval } from "react-loader-spinner";

const ButtonSpinner = () => {
	return (
		<span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
			<Oval
				visible={true}
				width="15"
				strokeWidth="8"
				color="rgb(100 116 139)"
				secondaryColor="rgb(203 213 225)"
				ariaLabel="oval-loading"
			/>
		</span>
	);
};

export default ButtonSpinner;
