import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { InjectConfigPlugin } from './vite-plugins';

export default defineConfig(async ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	mkdirSync(resolve('public'), { recursive: true });

	return {
		base: '/',
		plugins: [
			InjectConfigPlugin(env),
			react(),
			tailwindcss(),
			svgr(),
			checker({
				eslint: {
					lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
				}
			}),
			VitePWA({
				registerType: 'autoUpdate',
				injectRegister: null,
				srcDir: 'src',
				filename: 'service-worker.js', // Custom service worker (MUST exist in `src/`)
				strategies: 'injectManifest', // Uses `src/service-worker.js` for caching
				manifest: false, // Vite will use `public/manifest.json` automatically
				injectManifest: {
					maximumFileSizeToCacheInBytes: env.GENERATE_SOURCEMAP === 'true' ? 12 * 1024 * 1024 : 4 * 1024 * 1024,
				},
			}),

		],
		resolve: {
			alias: {
				'@': '/src',
			},
		},
		optimizeDeps: {
			include: ['wallet-common'],
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
		build: {
			manifest: true,
			sourcemap: env.GENERATE_SOURCEMAP === 'true',
			minify: env.GENERATE_SOURCEMAP !== 'true'
		},
	}
});
