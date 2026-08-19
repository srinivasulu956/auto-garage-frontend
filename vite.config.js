import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	define: {
		//some older libraries uses "global" word , but in browser we always use "window" as global thing;
		global: 'window',
	},
	resolve: {
		alias: {
			//use:import Header from '@/components/Header' instead of import Header from '../../../components/Header'
			'@': '/src',
			'@app': '/src/app',
			'@app-core': '/src/app-core',
			'@assets': '/src/assets',
		},

		//use:import App from './App' instead of import App from './App.jsx'
		// extensions: ['.js', '.jsx', '.ts', '.tsx'],

		//use:Prevents multiple versions of React (important in monorepos)
		// dedupe: ["react", "react-dom"],
	},
	server: {
		//use:opens browser immediately at port 7600
		open: true,
		port: 7600,
		proxy: {
			// Two backends now. The order of these keys matters: Vite tests them in turn and
			// the first prefix match wins, so the more specific /api/Auth must come first —
			// swap them and every login would be sent to the garage API and 404.
			//
			// The frontend itself knows nothing about the split. It still calls /api/Auth and
			// /api exactly as before, and this is what fans them out. In production the same
			// job belongs to a reverse proxy or an API gateway.
			'/api/Auth': {
				target: 'https://localhost:7300', // ← Auth service
				changeOrigin: true,
				secure: false,
			},

			// Everything else — bookings, vehicles, invoices, the AI assistant.
			// Proxied rather than called directly so requests look same-origin, which is what
			// lets the HTTP-only refresh cookie work in dev.
			'/api': {
				target: 'https://localhost:7224', // ← Garage API
				changeOrigin: true,
				secure: false, // ← accept self-signed certificate on localhost
			},
		},
	},
});
