/** @type {import('tailwindcss').Config} */
export default {
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
				'primary-dark': '#003476',
				'primary-dark-hover': '#003476',
				'primary': '#0750AF',
				'primary-hover': '#004195',
				'primary-light': '#1D6FDB',
				'primary-light-hover': '#0F59BA',
				'extra-light': '#42B6E9',
				'extra-light-hover': '#2CABE3',
			},
			screens: {
				'2xs': '360px',
				'xm': { 'max': '479px' },
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
				'quick-blur': {
					'0%': { filter: 'blur(2px)' },
					'100%': { filter: 'blur(0)' },
				},
			},
			animation: {
				'slide-in-up': 'slide-in-up 0.5s ease-out forwards',
				'slide-in-down': 'slide-in-down 0.5s ease-out forwards',
				'quick-blur': 'quick-blur 0.3s ease-in'
			},
		},
	},
	plugins: [],
};
