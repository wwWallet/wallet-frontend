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
				'extra-light': '#42B6E9',
				'extra-light-hover': '#5DB5D8',
			},
			screens: {
				'max480': { 'max': '480px' },
			},
			keyframes: {
				'slide-in-up': {
					'0%': { transform: 'translateY(100%)' },
					'100%': { transform: 'translateY(0)' },
				},
				'slide-in-down': {
					'0%': { transform: 'translateY(-100%)' },
					'100%': { transform: 'translateY(0)' },
				},
			},
			animation: {
				'slide-in-up': 'slide-in-up 0.5s ease-out forwards',
				'slide-in-down': 'slide-in-down 0.5s ease-out forwards',
			},
		},
	},
	plugins: [],
};
