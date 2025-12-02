import fs from 'fs';
import { copyFile, open } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import type { ManifestOptions } from 'vite-plugin-pwa';

function findBrandingFile(filePath: string): string|null {
	const customFilePath = path.join(
		path.dirname(filePath), "custom", path.basename(filePath)
	);

	if (fs.existsSync(customFilePath)) return customFilePath;
	if (fs.existsSync(filePath)) return filePath;
	return null
}

function findLogoFile(baseDir: string, name: string): string|null {
	const svgPath = findBrandingFile(path.join(baseDir, `${name}.svg`));
	const pngPath = findBrandingFile(path.join(baseDir, `${name}.png`));

	if (svgPath) return svgPath;
	if (pngPath) return pngPath;
	return null;
}

type GenerateAllIconsOptions = {
	sourceDir: string;
	publicDir: string;
	copySource?: boolean;
	appleTouchIcon?: boolean;
	manifestIconSizes: number[];
}

async function generateAllIcons({
	sourceDir,
	publicDir,
	copySource,
	appleTouchIcon,
	manifestIconSizes,
}: GenerateAllIconsOptions): Promise<ManifestOptions['icons']> {
	const faviconPath = findBrandingFile(path.join(sourceDir, "favicon.ico"));
	if (!faviconPath) {
		throw new Error("favicon not found");
	}

	const logoLightPath = findLogoFile(sourceDir, 'logo_light');
	if (!logoLightPath) {
		throw new Error("light mode logo not found");
	}

	const logoDarkPath  = findLogoFile(sourceDir, 'logo_dark');
	if (!logoDarkPath) {
		throw new Error("dark mode logo not found");
	}

	// Full scale svgs
	if (copySource !== false) {
		await Promise.all([
			copyFile(logoLightPath, path.join(publicDir, path.basename(logoLightPath))),
			copyFile(logoDarkPath, path.join(publicDir, path.basename(logoDarkPath))),
			copyFile(faviconPath, path.join(publicDir, path.basename(faviconPath))).catch(() => {
				console.warn(`No file ${faviconPath} was found, skipping...`);
			}),
		]);
	}

	const iconsDir = path.join(publicDir, 'icons');

	fs.mkdirSync(iconsDir, {
		recursive: true
	});

	// Apple touch icon
	if (appleTouchIcon !== false) {
		sharp(logoDarkPath)
			.png()
			.resize(180, 180)
			.toFile(path.join(iconsDir, 'apple-touch-icon.png'));
	}

	// Manifest icons
	const icons: ManifestOptions['icons'] = [];

	const manifestIcon = sharp(logoDarkPath).png()

	for (const size of manifestIconSizes) {
		const sizeStr = `${size}x${size}`;
		const fileName = `icon-${sizeStr}.png`;

		manifestIcon
			.resize(size, size)
			.toFile(path.join(iconsDir, fileName))

		icons.push({
			src: `icons/${fileName}`,
			sizes: sizeStr,
			type: 'image/png'
		});
	}

	return icons;
}

export async function generateManifest(env: Record<string, string|null|undefined>): Promise<Partial<ManifestOptions>> {
	const icons = await generateAllIcons({
		sourceDir: path.resolve('branding'),
		publicDir: path.resolve('public'),
		manifestIconSizes: [16, 32, 64, 192, 512],
	});
	return {
		"short_name": env.VITE_STATIC_NAME || 'wwWallet',
		"name": env.VITE_STATIC_NAME || 'wwWallet',
		"icons": icons,
		"screenshots": [
			{
				"src": "screenshots/screen_mobile_1.png",
				"sizes": "828x1792",
				"type": "image/png",
				"form_factor": "narrow",
				"label": "Home screen showing navigation and a credential"
			},
			{
				"src": "screenshots/screen_mobile_2.png",
				"sizes": "828x1792",
				"type": "image/png",
				"form_factor": "narrow",
				"label": "Credential selection view"
			},
			{
				"src": "screenshots/screen_tablet_1.png",
				"sizes": "2160x1620",
				"type": "image/png",
				"form_factor": "wide",
				"label": "Home screen showing navigation and a credential"
			},
			{
				"src": "screenshots/screen_tablet_2.png",
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

export function ManifestPlugin(env) {
	return {
		name: 'manifest-plugin',

		async configureServer(server) {
			// For dev
			const manifestPath = path.resolve("public/manifest.json");
			fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));

			server.watcher.on("change", async (file: string) => {
				file = path.relative(process.cwd(), file);

				if (file.endsWith(".env") || file.startsWith("branding")) {
					console.log("Environment file changed. Regenerating manifest...");
					fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));
				}
			});
		},
		async buildStart() {
			// For builds
			const manifestPath = path.resolve("public/manifest.json");
			fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));
		},
	}
}
