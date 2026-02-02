import fs from "node:fs";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

/**
 * Computes a stable hash from all branding inputs.
 * Changes ONLY when branding files change.
 */
export function getBrandingHash(brandingDir: string): string {
	const hash = crypto.createHash("sha256");

	function walk(dir: string) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else {
				hash.update(fullPath);
				hash.update(fs.readFileSync(fullPath));
			}
		}
	}

	walk(brandingDir);

	// 10 chars is enough to avoid collisions and keep URLs short
	return hash.digest("hex").slice(0, 10);
}

export type BrandingFile = {
	readonly pathname: string;
	readonly filename: string;
	readonly isDefault: boolean;
	readonly isCustom: boolean;
}

export function findBrandingFile(baseDir: string, filePath: string): BrandingFile | null {
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

	console.warn(`Deprecation Warning: Branding file found at: ${pathname}. This is no longer supported.`);

	return {
		pathname,
		filename,
		isDefault: hasDefault && !hasCustom,
		isCustom: hasCustom,
	}
}

export function findLogoFile(baseDir: string, name: string): BrandingFile | null {
	const svgFile = findBrandingFile(baseDir, path.join("logo", `${name}.svg`));
	const pngFile = findBrandingFile(baseDir, path.join("logo", `${name}.png`));

	if (svgFile?.isCustom) return svgFile;
	if (pngFile?.isCustom) return pngFile;
	if (svgFile?.isDefault) return svgFile;
	if (pngFile?.isDefault) return pngFile;

	// To be deprecated
	const deprecatedPathSvgFile = deprecated_findBrandingFile(path.join(baseDir, `${name}.svg`));
	const deprecatedPathPngFile = deprecated_findBrandingFile(path.join(baseDir, `${name}.png`));

	if (deprecatedPathSvgFile?.isCustom) return deprecatedPathSvgFile;
	if (deprecatedPathPngFile?.isCustom) return deprecatedPathPngFile;
	if (deprecatedPathSvgFile?.isDefault) return deprecatedPathSvgFile;
	if (deprecatedPathPngFile?.isDefault) return deprecatedPathPngFile;

	return null;
}


export type LogoFiles = Record<`logo_${'light' | 'dark'}`, BrandingFile>;

export function findLogoFiles(sourceDir: string): LogoFiles {
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


export function findScreenshotFile(sourceDir: string, filename: string): string {
	const customFile = path.join(sourceDir, "custom", "screenshots", filename);
	const defaultFile = path.join(sourceDir, "default", "screenshots", filename);

	if (fs.existsSync(customFile)) return customFile;
	if (fs.existsSync(defaultFile)) return defaultFile;

	throw new Error(`Screenshot not found: ${filename}`);
}

export async function copyScreenshots(sourceDir: string, publicDir: string): Promise<void> {
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

export type GenerateAllIconsOptions = {
	sourceDir: string;
	publicDir: string;
	copySource?: boolean;
	appleTouchIcon?: boolean;
	manifestIconSizes: number[];
	brandingHash?: string;
}


type StringLiteralUnion<T extends U, U = string> = T | (U & {});
type IconPurpose = 'monochrome' | 'maskable' | 'any';

export type Icons = Array<{
	sizes?: string;
	src: string;
	type?: string;
	purpose?: StringLiteralUnion<IconPurpose> | IconPurpose[];
}>

export async function generateAllIcons({
	sourceDir,
	publicDir,
	copySource,
	appleTouchIcon,
	manifestIconSizes,
	brandingHash,
}: GenerateAllIconsOptions): Promise<Icons> {
	const hashSuffix = brandingHash ? `?v=${brandingHash}` : '';

	const favicon = findBrandingFile(sourceDir, path.join("favicon.ico"))
		|| deprecated_findBrandingFile(path.join(sourceDir, "favicon.ico"));

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
		const ICON_SIZE = 180;
		const PADDING = 20;

		await sharp(logoLight.pathname)
			.resize(ICON_SIZE - PADDING * 2, ICON_SIZE - PADDING * 2, {
				fit: "contain",
			})
			.flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
			.extend({
				top: PADDING,
				bottom: PADDING,
				left: PADDING,
				right: PADDING,
				background: { r: 255, g: 255, b: 255, alpha: 1 },
			})
			.png()
			.toFile(path.join(iconsDir, 'apple-touch-icon.png'));
	}

	// Manifest icons
	const icons: Icons = [];

	const manifestLogoPathname = logoDark.pathname;

	for (const size of manifestIconSizes) {
		const sizeStr = `${size}x${size}`;
		const noPurposeFile = `icon-${sizeStr}.png`;
		const maskableFile = `icon-${sizeStr}-maskable.png`;

		const LOGO_SCALE = 0.75; // visible logo scale
		const logoSize = Math.round(size * LOGO_SCALE);
		const logoOffset = Math.round((size - logoSize) / 2);

		// ---------- NO PURPOSE - CIRCLE WHITE BACKGROUND ----------
		if (size === 192 || size === 512) {

			const bg = await sharp({
				create: {
					width: size,
					height: size,
					channels: 4,
					background: { r: 0, g: 0, b: 0, alpha: 0 },
				},
			})
				.composite([
					{
						input: Buffer.from(`
						<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
							<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
						</svg>
						`),
					},
				])
				.png()
				.toBuffer();

			const logo = await sharp(manifestLogoPathname)
				.resize(logoSize, logoSize, { fit: "contain" })
				.png()
				.toBuffer();

			await sharp(bg)
				.composite([{ input: logo, left: logoOffset, top: logoOffset }])
				.png()
				.toFile(path.join(iconsDir, noPurposeFile));

			icons.push({
				src: `icons/${noPurposeFile}${hashSuffix}`,
				sizes: sizeStr,
				type: "image/png",
			});

			// ---------- MASKABLE - FULL WHITE BACKGROUND ----------
			await sharp({
				create: {
					width: size,
					height: size,
					channels: 4,
					background: { r: 255, g: 255, b: 255, alpha: 1 },
				},
			})
				.composite([
					{
						input: await sharp(manifestLogoPathname)
							.resize(logoSize, logoSize, { fit: "contain" })
							.png()
							.toBuffer(),
						left: logoOffset,
						top: logoOffset,
					},
				])
				.png()
				.toFile(path.join(iconsDir, maskableFile));

			icons.push({
				src: `icons/${maskableFile}${hashSuffix}`,
				sizes: sizeStr,
				type: "image/png",
				purpose: "maskable",
			});

			continue;
		}

		// ---------- SMALL ICONS - NO PURPOSE ----------
		await sharp(manifestLogoPathname)
			.resize(size, size, { fit: "contain" })
			.png()
			.toFile(path.join(iconsDir, noPurposeFile));

		icons.push({
			src: `icons/${noPurposeFile}${hashSuffix}`,
			sizes: sizeStr,
			type: "image/png",
		});
	}

	return icons;
}
