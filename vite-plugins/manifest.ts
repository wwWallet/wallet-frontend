import fs from 'fs';
import { copyFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { Plugin } from 'vite';
import type { ManifestOptions } from 'vite-plugin-pwa';
import {
	deprecated_findBrandingFile,
	findBrandingFile,
	findLogoFiles,
	findScreenshotFile,
} from './resources/branding';
import { Env } from './resources/types';
import { BRANDING_DIR, PUBLIC_DIR } from './resources/dirs';

async function copyScreenshots(sourceDir: string, publicDir: string): Promise<void> {
	const files = [
		"screen_mobile_1.png",
		"screen_mobile_2.png",
		"screen_tablet_1.png",
		"screen_tablet_2.png",
	];

	const screenshotsDir = path.join(publicDir, "screenshots");
	fs.mkdirSync(screenshotsDir, { recursive: true });

	for (const file of files) {
		const source = findScreenshotFile(sourceDir, file);
		await copyFile(source, path.join(screenshotsDir, file));
	}
}

type GenerateAllIconsOptions = {
	sourceDir: string;
	publicDir: string;
	copySource?: boolean;
	appleTouchIcon?: boolean;
	manifestIconSizes: number[];
}

type GeneratedBrandingFile = {
	serve: {
		url: string;
		type: string;
		source: string | Buffer;
		allPossiblePathnames: string[];
	};
	emit: {
		type: 'asset';
		fileName: string;
		name?: string;
		needsCodeReference?: boolean;
		originalFileName: string | null;
		source: string | Uint8Array;
	}
}

function favicon(): GeneratedBrandingFile {
	const favicon = findBrandingFile(BRANDING_DIR, path.join("favicon.ico"))
		|| deprecated_findBrandingFile(path.join(BRANDING_DIR, "favicon.ico"));

	if (!favicon) {
		throw new Error("favicon not found");
	}

	const source = fs.readFileSync(favicon.pathname);

	return {
		serve: {
			url: "/favicon.ico",
			type: "image/x-icon",
			source,
			allPossiblePathnames: favicon.allPossiblePathnames,
		},
		emit: {
			type: 'asset',
			fileName: favicon.filename,
			originalFileName: favicon.pathname,
			source,
		}
	}
}

async function generateAllIcons({
	sourceDir,
	publicDir,
	copySource,
	appleTouchIcon,
	manifestIconSizes,
}: GenerateAllIconsOptions): Promise<ManifestOptions['icons']> {
	// const favicon = findBrandingFile(sourceDir, path.join("favicon.ico"))
	// 	|| deprecated_findBrandingFile(path.join(sourceDir, "favicon.ico"));

	// if (!favicon) {
	// 	throw new Error("favicon not found");
	// }

	const {
		logo_light: logoLight,
		logo_dark: logoDark,
	} = findLogoFiles(sourceDir);

	// Full scale logos
	if (copySource !== false) {
		await Promise.all([
			copyFile(logoLight.pathname, path.join(publicDir, logoLight.filename)),
			copyFile(logoDark.pathname, path.join(publicDir, logoDark.filename)),
			// copyFile(favicon.pathname, path.join(publicDir, path.basename(favicon.filename))).catch(() => {
			// 	console.warn(`No file ${favicon} was found, skipping...`);
			// }),
		]);
	}

	const iconsDir = path.join(publicDir, 'icons');

	fs.mkdirSync(iconsDir, {
		recursive: true
	});

	// Apple touch icon
	if (appleTouchIcon !== false) {
		sharp(logoDark.pathname)
			.png()
			.resize(180, 180)
			.toFile(path.join(iconsDir, 'apple-touch-icon.png'));
	}

	// Manifest icons
	const icons: ManifestOptions['icons'] = [];

	const manifestIcon = sharp(logoDark.pathname).png()

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

export async function generateManifest(env: Record<string, string | null | undefined>): Promise<Partial<ManifestOptions>> {
	const icons = await generateAllIcons({
		sourceDir: BRANDING_DIR,
		publicDir: PUBLIC_DIR,
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

function generateFiles(): Record<string,GeneratedBrandingFile> {
	return {
		favicon: favicon(),
	}
}

export function ManifestPlugin(env: Env): Plugin {
	return {
		name: 'branding-manifest-plugin',

		config() {
			const { logo_light, logo_dark } = findLogoFiles(BRANDING_DIR);

			return {
				define: {
					"import.meta.env.BRANDING_LOGO_LIGHT": JSON.stringify(`/${logo_light.filename}`),
					"import.meta.env.BRANDING_LOGO_DARK": JSON.stringify(`/${logo_dark.filename}`),
				}
			}
		},

		async configureServer(server) {
			// For dev
			const manifestPath = path.resolve("public/manifest.json");

			// copy screenshots (custom → default) into public/screenshots
			await copyScreenshots(BRANDING_DIR, PUBLIC_DIR);

			fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));

			let files = generateFiles();

			for (const key in files) {
				const file = files[key];

				server.watcher.add(file.serve.allPossiblePathnames)

				server.middlewares.use(file.serve.url, (req, res) => {
					const latestFile = files[key];

					res.setHeader("Content-Type", latestFile.serve.type);
					res.end(latestFile.serve.source);
				});
			}

			server.watcher.on("all", async (eventName, file: string) => {
				file = path.relative(process.cwd(), file);

				if (file.endsWith(".env") || file.startsWith("branding")) {
					console.log("Environment file changed. Regenerating manifest & screenshots...");
					await copyScreenshots(BRANDING_DIR, PUBLIC_DIR);
					fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));

					files = generateFiles();
				}
			});
		},

		async buildStart() {
			// For builds
			const manifestPath = path.resolve("public/manifest.json");

			await copyScreenshots(BRANDING_DIR, PUBLIC_DIR);
			fs.writeFileSync(manifestPath, JSON.stringify(await generateManifest(env), null, 2));

			this.emitFile({
				type: "asset"
			})
		},
	}
}
