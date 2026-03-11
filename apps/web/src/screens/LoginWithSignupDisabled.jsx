import { useState } from "react";
import ErrorMessage from "../components/ErrorMessage";
import supabase from "../config/supabaseClient";

const LoginWithSignupDisabled = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();
		handleLogin();
	};

	const handleLogin = async () => {
		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) {
			setError(error.message);
			return;
		}
	};

	return (
		<div className="w-screen h-screen flex justify-center items-center bg-slate-100">
			<div className="w-1/3 p-5 bg-white border border-slate-300 rounded-lg">
				<div className="text-xl text-slate-600 font-semibold mb-3">Login</div>
				<form className="flex flex-col gap-4 mb-3" onSubmit={handleSubmit}>
					<div>
						<div className="text-slate-500 mb-0.5">Email</div>
						<input
							className="border border-slate-300 w-full rounded py-1 px-2 text-sm"
							type="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setError(null);
							}}
						/>
					</div>
					<div>
						<div className="text-slate-500 mb-0.5">Password</div>
						<input
							className="border border-slate-300 w-full rounded py-1 px-2 text-sm"
							type="password"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setError(null);
							}}
						/>
					</div>
					<button
						type="submit"
						className="bg-cGreen-light hover:bg-cGreen-lightHover border border-slate-300 rounded text-sm text-slate-700 p-1"
					>
						Login
					</button>
				</form>
				<div className="mb-3">
					<ErrorMessage error={error} />
				</div>
				<div className="w-full flex justify-center underline">Sorry, signup is disabled for the moment.</div>
			</div>
		</div>
	);
};

export default LoginWithSignupDisabled;
