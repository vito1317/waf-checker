/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/static/**/*.{html,js}',
	],
	theme: {
		extend: {
			colors: {
				cyber: {
					bg: '#0a0e14',
					'bg-secondary': '#0d1117',
					card: '#161b22',
					elevated: '#1c2128',
					accent: '#00d9ff',
					success: '#00ff9d',
					danger: '#ff3860',
					warning: '#ffb347',
				},
			},
			fontFamily: {
				sans: ['Outfit', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace'],
			},
		},
	},
	plugins: [],
};
