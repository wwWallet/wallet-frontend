import fs from 'fs';
import path from 'path';
import { Plugin } from 'vite';
import type { ManifestOptions } from 'vite-plugin-pwa';
import { copyScreenshots, findLogoFiles, generateAllIcons } from '../branding';


export async function generateManifest(env: Record<string, string | null | undefined>): Promise<Partial<ManifestOptions>> {
	const brandingHash = env.VITE_BRANDING_HASH ?? undefined;
	const hashSuffix = brandingHash ? `?v=${brandingHash}` : '';

	const icons = await generateAllIcons({
		sourceDir: path.resolve('branding'),
		publicDir: path.resolve('public'),
		manifestIconSizes: [16, 32, 64, 192, 512],
		brandingHash,
	});

	return {
		"short_name": env.VITE_STATIC_NAME || 'wwWallet',
		"name": env.VITE_STATIC_NAME || 'wwWallet',
		"icons": icons,
		"screenshots": [
			{
				"src": `screenshots/screen_mobile_1.png${hashSuffix}`,
				"sizes": "828x1792",
				"type": "image/png",
				"form_factor": "narrow",
				"label": "Home screen showing navigation and a credential"
			},
			{
				"src": `screenshots/screen_mobile_2.png${hashSuffix}`,
				"sizes": "828x1792",
				"type": "image/png",
				"form_factor": "narrow",
				"label": "Credential selection view"
			},
			{
				"src": `screenshots/screen_tablet_1.png${hashSuffix}`,
				"sizes": "2160x1620",
				"type": "image/png",
				"form_factor": "wide",
				"label": "Home screen showing navigation and a credential"
			},
			{
				"src": `screenshots/screen_tablet_2.png${hashSuffix}`,
				"sizes": "2160x1620",
				"type": "image/png",
				"form_factor": "wide",
				"label": "Credential selection view"
			}
		],
		"start_url": "/",
		"display": "standalone",
		"theme_color": "#111827",
		"description": `${process.env.VITE_STATIC_NAME || 'wwWallet'} enables secure storage and management of verifiable credentials.`,
		"background_color": "#ffffff",
		"scope": "/",
		"dir": "ltr",
		"lang": "en"
	};
}

export function BrandingManifestPlugin(env): Plugin {
	const sourceDir = path.resolve("branding");
	const publicDir = path.resolve("public");
	const hashSuffix = env.VITE_BRANDING_HASH ? `?v=${env.VITE_BRANDING_HASH}` : '';

	return {
		name: 'branding-manifest-plugin',

		config() {
			const { logo_light, logo_dark } = findLogoFiles(sourceDir);
			return {
				define: {
					"import.meta.env.BRANDING_LOGO_LIGHT": JSON.stringify(`/${logo_light.filename}${hashSuffix}`),
					"import.meta.env.BRANDING_LOGO_DARK": JSON.stringify(`/${logo_dark.filename}${hashSuffix}`),
				}
			}
		},

		async configureServer(server) {
			// For dev
			const manifestPath = path.resolve("public/manifest.json");

			// copy screenshots (custom → default) into public/screenshots
			await copyScreenshots(sourceDir, publicDir);

			fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));

			server.watcher.on("change", async (file: string) => {
				file = path.relative(process.cwd(), file);

				if (file.endsWith(".env") || file.startsWith("branding")) {
					console.log("Environment file changed. Regenerating manifest & screenshots...");
					await copyScreenshots(sourceDir, publicDir);
					fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));
				}
			});
		},

		async buildStart() {
			// For builds
			const manifestPath = path.resolve("public/manifest.json");

			await copyScreenshots(sourceDir, publicDir);
			fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));
		},
	}
}
