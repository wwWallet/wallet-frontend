import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
	base: '/',
	plugins: [
		react(),
		svgr(),
		eslint(),
	],
	resolve: {
		alias: {
			'@': '/src',
		},
	},
	server: {
		port: 3000,
	},
});
