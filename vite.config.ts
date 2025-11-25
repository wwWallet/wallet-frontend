import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import { ManifestPlugin, MobileWrapperWKAppLinksPlugin, RobotsTxtPlugin, SitemapPlugin } from './vite-plugins';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	return {
		base: '/',
		plugins: [
			react(),
			tailwindcss(),
			svgr(),
			checker({
				eslint: {
					lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
				}
			}),
			ManifestPlugin(env),
			RobotsTxtPlugin(env),
			SitemapPlugin(env),
			MobileWrapperWKAppLinksPlugin(env),
			VitePWA({
				registerType: 'autoUpdate',
				injectRegister: null,
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
			minify: env.VITE_GENERATE_SOURCEMAP !== 'true'
		},
	}
});
