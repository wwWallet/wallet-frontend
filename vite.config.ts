import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import fs from "fs";
import path from "path";

function generateManifest(env) : Partial<ManifestOptions>{

	return {
		"short_name": env.VITE_STATIC_NAME || 'wwWallet',
		"name": env.VITE_STATIC_NAME || 'wwWallet',
		"icons": [
			{
				"src": "wallet_16.png",
				"sizes": "16x16",
				"type": "image/png"
			},
			{
				"src": "wallet_32.png",
				"sizes": "32x32",
				"type": "image/png"
			},
			{
				"src": "wallet_64.png",
				"sizes": "64x64",
				"type": "image/png"
			},
			{
				"src": "wallet_192.png",
				"sizes": "192x192",
				"type": "image/png"
			},
			{
				"src": "wallet_512.png",
				"sizes": "512x512",
				"type": "image/png"
			}
		],
		"screenshots": [
			{
				"src": "screenshots/screen_mobile_1.png",
				"sizes": "800x1714",
				"type": "image/png",
				"form_factor": "narrow",
				"label": "Home screen showing navigation and a credential"
			},
			{
				"src": "screenshots/screen_mobile_2.png",
				"sizes": "800x1714",
				"type": "image/png",
				"form_factor": "narrow",
				"label": "Credential details view"
			},
			{
				"src": "screenshots/screen_tablet_1.png",
				"sizes": "2048x1536",
				"type": "image/png",
				"form_factor": "wide",
				"label": "Home screen showing navigation and a credential"
			},
			{
				"src": "screenshots/screen_tablet_2.png",
				"sizes": "2048x1536",
				"type": "image/png",
				"form_factor": "wide",
				"label": "Credential details view"
			}
		],
		"start_url": ".",
		"display": "standalone",
		"orientation": "any",
		"theme_color": "#003476",
		"description": `${process.env.VITE_STATIC_NAME} enables secure storage and management of verifiable credentials.`,
		"background_color": "#ffffff",
		"scope": "/",
		"dir": "ltr",
		"lang": "en"
	};
}

function ManifestPlugin(env) {
	return {
		name: 'manifest-plugin',

		configureServer(server) {
			// For dev
			const manifestPath = path.resolve("public/manifest.json");
			fs.writeFileSync(manifestPath, JSON.stringify(generateManifest(env), null, 2));

			server.watcher.on("change", (file) => {
				if (file.endsWith(".env")) {
					console.log("Environment file changed. Regenerating manifest...");
					fs.writeFileSync(manifestPath, JSON.stringify(generateManifest(env), null, 2));
				}
			});
		},
		buildStart() {
			// For builds
			const manifestPath = path.resolve("public/manifest.json");
			fs.writeFileSync(manifestPath, JSON.stringify(generateManifest(env), null, 2));
		},
	}
}

export default defineConfig(({mode}) => {
	const env = loadEnv(mode ,process.cwd(), '')
	return {
		base: '/',
		plugins: [
			react(),
			svgr(),
			eslint(),
			ManifestPlugin(env),
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
		},
		preview: {
			host: true,
			port: 3000,
			open: true,
		},
	}
});
