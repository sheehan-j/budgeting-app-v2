/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "selector",
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	fontFamily: {
		sans: ["Inter", "sans-serif"],
	},
	theme: {
		extend: {
			colors: {
				cGreen: {
					DEFAULT: "rgb(124, 194, 112)",
					dark: "rgb(102, 174, 89)",
					light: "rgb(212, 244, 206)",
					lighter: "rgb(221, 241, 217)",
					lightHover: "rgb(210, 240, 204)",
					lightTrans: "rgb(212, 244, 206, 0.3)",
				},
			},
		},
	},
	plugins: [],
};
