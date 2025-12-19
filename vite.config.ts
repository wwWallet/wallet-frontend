import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import {
	BrandingManifestPlugin,
	MetadataImagePlugin,
	MobileWrapperWKAppLinksPlugin,
	RobotsTxtPlugin,
	SitemapPlugin,
	ThemePlugin,
	getBrandingHash
} from './vite-plugins';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	const brandingHash = getBrandingHash(path.resolve('branding')); // Compute branding hash from your branding folder
	process.env.VITE_BRANDING_HASH = brandingHash; // import.meta.env.VITE_BRANDING_HASH works in TS/JS
	env.VITE_BRANDING_HASH = brandingHash; // VITE_BRANDING_HASH% works in index.html
	return {
		base: '/',
		plugins: [
			ThemePlugin(),
			react(),
			tailwindcss(),
			svgr(),
			checker({
				eslint: {
					lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
				}
			}),
			BrandingManifestPlugin(env),
			MetadataImagePlugin(env),
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
