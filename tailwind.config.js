/** @type {import('tailwindcss').Config} */

const brandColor = {
	"300": "hsl(217, 5%, 66%)",
	"400": "hsl(217, 40%, 45%)",
	"500": "hsl(217, 66%, 32%)",
	"600": "hsl(217, 40%, 30%)",
	"700": "hsl(217, 10%, 33%)",
};

const config = {
	darkMode: "class",
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
				"primary": brandColor['500'],
				"primary-hover": brandColor['600'],

				"brand": brandColor,

				"c-lm-red": "hsl(3, 76%, 42%)",
				"c-lm-red-hover": "hsl(3, 76%, 48%)",
				"c-lm-red-light": "hsl(3, 76%, 93%)",
				"c-lm-red-dark": "hsl(3, 75%, 38%)",
				"c-lm-red-dark-hover": "hsl(3, 75%, 48%)",

				"c-dm-red": "hsl(3, 100%, 54%)",
				"c-dm-red-hover": "hsl(3, 100%, 60%)",
				"c-dm-red-light": "hsl(3, 100%, 95%)",
				"c-dm-red-dark": "hsl(3, 100%, 40%)",
				"c-dm-red-dark-hover": "hsl(3, 100%, 48%)",

				"c-lm-orange": "hsl(35, 100%, 50%)",
				"c-lm-orange-bg": "hsl(35, 100%, 50%)",

				"c-dm-orange": "hsl(36, 100%, 52%)",
				"c-dm-orange-bg": "hsl(36, 100%, 52%)",

				"c-lm-yellow": "hsl(48, 100%, 50%)",
				"c-dm-yellow": "hsl(50, 100%, 52%)",

				"c-lm-green": "hsl(135, 64%, 27%)",
				"c-lm-green-bg": "hsl(135, 64%, 27%)",

				"c-dm-green": "hsl(135, 64%, 50%)",
				"c-dm-green-bg": "hsl(135, 64%, 50%)",

				"c-lm-mint": "hsl(177, 100%, 39%)",
				"c-dm-mint": "hsl(178, 72%, 65%)",

				"c-lm-teal": "hsl(189, 61%, 48%)",
				"c-dm-teal": "hsl(189, 72%, 56%)",

				"c-lm-cyan": "hsl(199, 78%, 55%)",
				"c-dm-cyan": "hsl(197, 100%, 70%)",

				"c-lm-blue": "hsl(211, 96%, 28%)",
				"c-dm-blue": "hsl(210, 100%, 52%)",

				"c-lm-indigo": "hsl(241, 61%, 59%)",
				"c-dm-indigo": "hsl(241, 73%, 63%)",

				"c-lm-purple": "hsl(280, 68%, 60%)",
				"c-dm-purple": "hsl(280, 85%, 65%)",

				"c-lm-pink": "hsl(349, 100%, 59%)",
				"c-dm-pink": "hsl(348, 100%, 61%)",

				"c-lm-gray": {
					'50':   "hsl(0, 0%, 100%)",
					'100':  "hsl(220, 8%, 100%)",
					'200':  "hsl(220, 8%, 97.6%)",
					'300':  "hsl(220, 8%, 93.3%)",
					'400':  "hsl(220, 8%, 88.6%)",
					'500':  "hsl(220, 8%, 80.8%)",
					'600':  "hsl(220, 8%, 66.7%)",
					'700':  "hsl(220, 8%, 47.1%)",
					'800':  "hsl(220, 8%, 21.2%)",
					'900':  "hsl(220, 20%, 5.7%)",
					'950':  "hsl(0, 0%, 0%)"
				},
				"c-dm-gray": {
					'50':   "hsl(0, 0%, 100%)",
					'100':  "hsl(220, 6%, 92.2%)",
					'200':  "hsl(220, 7%, 79.6%)",
					'300':  "hsl(220, 3%, 63.3%)",
					'400':  "hsl(220, 2%, 50.4%)",
					'500':  "hsl(220, 3%, 27.6%)",
					'600':  "hsl(220, 4%, 20.6%)",
					'700':  "hsl(220, 5%, 14.3%)",
					'800':  "hsl(220, 9%, 10.2%)",
					'900':  "hsl(220, 20%, 5.7%)",
					'950':  "hsl(0, 0%, 0%)"
				}

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

export default config;
