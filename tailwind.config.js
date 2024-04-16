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
				'primary-light': '#4169E1',
				'primary-light-hover': '#0F52BA',
				'extra-light': '#68caf1',
				'extra-light-hover': '#5DB5D8',
			},
			screens: {
				'max480': { 'max': '480px' },
			}
		},
	},
	plugins: [],
};
