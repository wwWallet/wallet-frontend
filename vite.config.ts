import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa';
import { ManifestPlugin, MobileWrapperWKAppLinksPlugin, RobotsTxtPlugin, SitemapPlugin } from './vite-plugins';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	return {
		base: '/',
		plugins: [
			react(),
			svgr(),
			eslint({
				include: ['src/**/*.{js,jsx,ts,tsx}'],
				// make feedback visible
				lintOnStart: true,		// run at server start
				emitWarning: true,		// print warnings to terminal
				emitError: true,			// print errors to terminal
				// don’t kill dev
				failOnWarning: false,
				failOnError: false,
			}),
			ManifestPlugin(env),
			RobotsTxtPlugin(env),
			SitemapPlugin(env),
			MobileWrapperWKAppLinksPlugin(env),
			VitePWA({
				registerType: 'autoUpdate',
				srcDir: 'src',
				filename: 'service-worker.js', // Custom service worker (MUST exist in `src/`)
				strategies: 'injectManifest', // Uses `src/service-worker.js` for caching
				manifest: false, // Vite will use `public/manifest.json` automatically
				injectManifest: {
					maximumFileSizeToCacheInBytes: env.VITE_GENERATE_SOURCEMAP === 'true' ? 12 * 1024 * 1024 : 4 * 1024 * 1024,
				},
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
		build: {
			sourcemap: env.VITE_GENERATE_SOURCEMAP === 'true',
			minify: env.VITE_GENERATE_SOURCEMAP !== 'true'
		},
	}
});
