/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#e12a20",
                "primary-accent": "#fc4204",
                "background-light": "#FFFFFF",
                "background-dark": "#151a23",
                "sidebar-dark": "#151a23",
                "accent-red": "#e12a20",
                "status-green": "#22C55E",
                "status-orange": "#fc4204",
                "border-gray": "#E5E7EB",
                "dark-border": "#1F2937",
            },
            fontFamily: {
                "display": ["Public Sans", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                lg: "0.5rem",
                xl: "0.75rem",
                full: "9999px",
            },
        },
    },
    plugins: [],
}
