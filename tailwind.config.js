/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        'xl': '1rem',
      },
			width:{
				'55':55,
			},
      colors: {
        'custom-blue': '#003476',
        'light-red': '#ffcccc'
      }
    },
  },
  plugins: [],
};

