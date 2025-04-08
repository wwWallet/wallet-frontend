import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';
import { ManifestOptions, VitePWA } from 'vite-plugin-pwa';
import fs from "fs";
import path from "path";

function generateManifest(env): Partial<ManifestOptions> {

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
		"description": `${process.env.VITE_STATIC_NAME || 'wwWallet'} enables secure storage and management of verifiable credentials.`,
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

function generateRobotsTxt(env: Record<string, string>): string {
	const baseUrl = env.VITE_STATIC_PUBLIC_URL || 'https://demo.wwwallet.org';
	return `
User-agent: *
Disallow: /settings
Disallow: /credential/
Disallow: /history
Disallow: /add
Disallow: /send
Allow: /login

Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`.trim();
}

function RobotsTxtPlugin(env) {
	return {
		name: 'robots-txt-plugin',

		configureServer(server) {
			const robotsPath = path.resolve("public/robots.txt");
			fs.writeFileSync(robotsPath, generateRobotsTxt(env));

			server.watcher.on("change", (file) => {
				if (file.endsWith(".env")) {
					console.log("Environment file changed. Regenerating robots.txt...");
					fs.writeFileSync(robotsPath, generateRobotsTxt(env));
				}
			});
		},

		buildStart() {
			const robotsPath = path.resolve("public/robots.txt");
			fs.writeFileSync(robotsPath, generateRobotsTxt(env));
		},
	};
}

function generateSitemapXml(env: Record<string, string>): string {
	const baseUrl = env.VITE_STATIC_PUBLIC_URL || 'https://demo.wwwallet.org';
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}/login</loc>
		<lastmod>${today}</lastmod>
		<priority>1.0</priority>
		<changefreq>monthly</changefreq>
	</url>
</urlset>
`;
}
function SitemapPlugin(env) {
	return {
		name: 'sitemap-plugin',
		configureServer(server) {
			const sitemapPath = path.resolve("public/sitemap.xml");
			fs.writeFileSync(sitemapPath, generateSitemapXml(env));
			server.watcher.on("change", (file) => {
				if (file.endsWith(".env")) {
					console.log("Environment file changed. Regenerating sitemap.xml...");
					fs.writeFileSync(sitemapPath, generateSitemapXml(env));
				}
			});
		},
		buildStart() {
			const sitemapPath = path.resolve("public/sitemap.xml");
			fs.writeFileSync(sitemapPath, generateSitemapXml(env));
		},
	};
}

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
		},
		preview: {
			host: true,
			port: 3000,
			open: true,
		},
	}
});
