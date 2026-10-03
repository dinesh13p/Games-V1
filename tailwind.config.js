/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Arial', 'Helvetica', 'sans-serif'],
                serif: ['Georgia', 'Times New Roman', 'serif'],
                mono: ['Courier New', 'Courier', 'monospace'],
            },
            colors: {
                paper: '#e7e1d5', surface: '#f1ecdf', ink: '#262b25',
                muted: '#626557', accent: '#a3422a', olive: '#46533b', line: '#b9b3a5',
            },
        },
    },
    plugins: [],
}
