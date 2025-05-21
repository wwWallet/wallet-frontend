import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';
import { VitePWA } from 'vite-plugin-pwa';
import { ManifestPlugin, RobotsTxtPlugin, SitemapPlugin } from './vite-plugins';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '')
	return {
		base: '/',
		plugins: [
			react(),
			svgr(),
			eslint(),
			ManifestPlugin(env),
			RobotsTxtPlugin(env),
			SitemapPlugin(env),
			VitePWA({
				registerType: 'autoUpdate',
				srcDir: 'src',
				filename: 'service-worker.js', // Custom service worker (MUST exist in `src/`)
				strategies: 'injectManifest', // Uses `src/service-worker.js` for caching
				manifest: false, // Vite will use `public/manifest.json` automatically
				injectManifest: {
					maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
			headers: {
				"Strict-Transport-Security": "max-age=86400; includeSubDomains",
				"X-Content-Type-Options": "nosniff",
				"X-Frame-Options": "DENY",
				"X-XSS-Protection": "1; mode=block",

				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
				"Cross-Origin-Resource-Policy": "same-origin",

				// Merged CSP
				"Content-Security-Policy": [
					"base-uri 'none'",
					// "default-src 'self'",
					"object-src 'none'",
					"frame-src 'self' https: blob: data:",
					"connect-src 'self' https: wss: blob: data:",
					// "script-src 'self' 'wasm-unsafe-eval'",
					"img-src 'self' https: blob: data:",
					"media-src 'self' https: blob: data:",
					"font-src 'self' blob: data:",
					"style-src 'self' 'unsafe-inline'",
					// "require-trusted-types-for 'script'",
					"frame-ancestors 'self'"
				].join("; "),
			}
		},
		preview: {
			host: true,
			port: 3000,
			open: true,
		},
		build: {
			sourcemap: env.VITE_GENERATE_SOURCEMAP === 'true',
		},
	}
});
