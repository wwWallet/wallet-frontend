import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	base: '/',
	plugins: [
		react(),
		svgr(),
		eslint(),
		VitePWA({
			registerType: 'autoUpdate',
			srcDir: 'src',
			filename: 'service-worker.js', // Custom service worker (MUST exist in `src/`)
			strategies: 'injectManifest', // Uses `src/service-worker.js` for caching
			manifest: false, // Vite will use `public/manifest.json` automatically
		}),

	],
	resolve: {
		alias: {
			'@': '/src',
		},
	},
	server: {
		host: true,
		port: 3000,
		open: true,
	},
	preview: {
		host: true,
		port: 3000,
		open: true,
	},
});
