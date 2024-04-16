/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			borderRadius: {
				'xl': '1rem',
			},
			width: {
				'55': 55,
			},
			colors: {
				'primary': '#003476',
				'primary-hover': '#002b62',
				'secondary': '#4169E1',
				'secondary-hover': '#0F52BA',
			},
			screens: {
				'max480': { 'max': '480px' },
			}
		},
	},
	plugins: [],
};
