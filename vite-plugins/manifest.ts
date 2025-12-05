import fs from 'fs';
import { copyFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { Plugin } from 'vite';
import type { ManifestOptions } from 'vite-plugin-pwa';

type BrandingFile = {
	readonly pathname: string;
	readonly filename: string;
	readonly isDefault: boolean;
	readonly isCustom: boolean;
}

function findBrandingFile(baseDir: string, filePath: string): BrandingFile | null {
	const defaultFilePath = path.join(baseDir, "default", filePath);
	const customFilePath = path.join(baseDir, "custom", filePath);

	const hasDefault = fs.existsSync(defaultFilePath);
	const hasCustom = fs.existsSync(customFilePath);

	if (!hasDefault && !hasCustom) {
		return null;
	}

	const pathname = hasCustom ? customFilePath : defaultFilePath;
	const filename = path.basename(pathname);

	return {
		pathname,
		filename,
		isDefault: hasDefault && !hasCustom,
		isCustom: hasCustom,
	}
}

function deprecated_findBrandingFile(filePathInput: string): BrandingFile | null {
	const customFilePath = path.join(
		path.dirname(filePathInput), "custom", path.basename(filePathInput)
	);

	const hasDefault = fs.existsSync(filePathInput);
	const hasCustom = fs.existsSync(customFilePath);

	if (!hasDefault && !hasCustom) {
		return null;
	}

	const pathname = hasCustom ? customFilePath : filePathInput;
	const filename = path.basename(pathname);

	return {
		pathname,
		filename,
		isDefault: hasDefault && !hasCustom,
		isCustom: hasCustom,
	}
}


function findLogoFile(baseDir: string, name: string): BrandingFile|null {
	const svgFile = findBrandingFile(baseDir, path.join("logo", `${name}.svg`));
	const pngFile = findBrandingFile(baseDir, path.join("logo", `${name}.png`));

	if (svgFile?.isCustom) return svgFile;
	if (pngFile?.isCustom) return pngFile;
	if (svgFile?.isDefault) return svgFile;
	if (pngFile?.isDefault) return pngFile;

	// To be deprecated
	const deprecatedPathSvgFile = deprecated_findBrandingFile(path.join(baseDir, `${name}.svg`));
	const deprecatedPathPngFile = deprecated_findBrandingFile(path.join(baseDir, `${name}.png`));

	if (deprecatedPathSvgFile) {
		console.warn(`Deprecation Warning: Logo found at: ${deprecatedPathSvgFile.pathname}. This is no longer supported.`);
	}

	if (deprecatedPathPngFile) {
		console.warn(`Deprecation Warning: Logo found at: ${deprecatedPathPngFile.pathname}. This is no longer supported.`);
	}

	if (deprecatedPathSvgFile?.isCustom) return deprecatedPathSvgFile;
	if (deprecatedPathPngFile?.isCustom) return deprecatedPathPngFile;
	if (deprecatedPathSvgFile?.isDefault) return deprecatedPathSvgFile;
	if (deprecatedPathPngFile?.isDefault) return deprecatedPathPngFile;

	return null;
}

type LogoFiles = Record<`logo_${'light'|'dark'}`, BrandingFile>;

function findLogoFiles(sourceDir: string): LogoFiles {
	const files: Partial<LogoFiles> = {};

	for (const logoId of ["logo_light", "logo_dark"] as const) {
		const logoFile = findLogoFile(sourceDir, logoId);
		if (!logoFile) {
			throw new Error(`${logoId} not found in ${sourceDir}`);
		}

		files[logoId] = logoFile
	}

	return files as LogoFiles;
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
	const favicon = findBrandingFile(sourceDir, path.join("favicon.ico"));
	if (!favicon) {
		throw new Error("favicon not found");
	}

	const {
		logo_light: logoLight,
		logo_dark: logoDark,
	} = findLogoFiles(sourceDir);

	// Full scale logos
	if (copySource !== false) {
		await Promise.all([
			copyFile(logoLight.pathname, path.join(publicDir, logoLight.filename)),
			copyFile(logoDark.pathname, path.join(publicDir, logoDark.filename)),
			copyFile(favicon.pathname, path.join(publicDir, path.basename(favicon.filename))).catch(() => {
				console.warn(`No file ${favicon} was found, skipping...`);
			}),
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

export function ManifestPlugin(env): Plugin {
	return {
		name: 'manifest-plugin',

		config() {
			const { logo_light, logo_dark } = findLogoFiles(path.resolve('branding'));

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
