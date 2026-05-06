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
			// Proxies all /api requests to the backend
			// This makes cookies work in dev since requests appear same-origin
			'/api': {
				target: 'https://localhost:7224', // ← your backend URL
				changeOrigin: true,
				secure: false, // ← accept self-signed certificate on localhost
			},
		},
	},
});
