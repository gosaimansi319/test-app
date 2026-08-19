/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

export default withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        'shadow-custom-shadow': '0px 10px 30px 0px rgba(0, 0, 0, 0.05)',
      },
      colors: {
        green: {
           900: "#15A46E",
           400: "#ddd",
           500: "#000"
        },
        primary: {
          900:"#9D6F00",
          700:"#DD8208",
          400: "#EDBC79"
        }
      },
      backgroundImage: {
        'radial-primary': 'radial-gradient(circle, #123456, #654321)',
        'custom-gradient': 'linear-gradient(to right, #ff7e5f, #feb47b)',
      },
      screens: {
        'xs': '0',
        'sm': '576px',
        'md': '768px',
        'lg': '992px',
        'xl': '1200px',
        '2xl': '1400px',
      },
    
    },
  },
  plugins: [],
});
