import fs from "node:fs";
import { copyFile, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { z } from "zod";
import convert, { RGB } from "color-convert";

// ============================================
// TYPES
// ============================================

export type BrandingFile = {
	/**
	 * Full path to the branding file.
	 */
	readonly pathname: string;
	/**
	 * Filename of the branding file.
	 */
	readonly filename: string;
	/**
	 * Whether this file is the default branding file.
	 */
	readonly isDefault: boolean;
	/**
	 * Whether this file is the custom branding file.
	 */
	readonly isCustom: boolean;
}

export type LogoFiles = Record<`logo_${'light' | 'dark'}`, BrandingFile>;

// ============================================
// FILE FINDERS
// ============================================

/**
 * Finds a branding file, preferring custom over default.
 *
 * @param baseDir Branding source directory.
 * @param filePath Relative file path within branding directory.
 */
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

/**
 * @deprecated Use `findBrandingFile` instead.
 */
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

/**
 * Finds a logo file (svg or png), preferring custom over default, svg over png.
 *
 * @param baseDir Branding source directory.
 * @param name Logo name (e.g., "logo_light" or "logo_dark").
 */
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

/**
 * Finds both light and dark logo files.
 *
 * @param sourceDir Branding source directory.
 * @throws if any logo is not found.
 */
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

// ============================================
// HASHING
// ============================================

/**
 * Computes a stable hash from all branding inputs.
 * Changes ONLY when branding files change.
 *
 * @param brandingDir Branding source directory.
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

// ============================================
// SCREENSHOTS
// ============================================

/**
 * Finds a screenshot file, preferring custom over default.
 *
 * @param sourceDir Branding source directory.
 * @param filename Screenshot filename.
 * @throws if not found.
 */
export function findScreenshotFile(sourceDir: string, filename: string): string {
	const customFile = path.join(sourceDir, "custom", "screenshots", filename);
	const defaultFile = path.join(sourceDir, "default", "screenshots", filename);

	if (fs.existsSync(customFile)) return customFile;
	if (fs.existsSync(defaultFile)) return defaultFile;

	throw new Error(`Screenshot not found: ${filename}`);
}

/**
 * Copies all screenshots from branding to public directory.
 */
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

// ============================================
// ICONS
// ============================================

export type GenerateAllIconsOptions = {
	/**
	 * Source branding directory.
	 */
	sourceDir: string;
	/**
	 * Public directory where to output the generated icons.
	 */
	publicDir: string;
	/**
	 * Whether to copy the source logo and favicon files to the public directory.
	 */
	copySource?: boolean;
	/**
	 * Whether to generate the Apple touch icon.
	 */
	appleTouchIcon?: boolean;
	/**
	 * Sizes of the manifest icons to generate.
	 */
	manifestIconSizes: number[];
	/**
	 * Optional branding hash to append to icon URLs for cache busting.
	 * @see getBrandingHash
	 */
	brandingHash?: string;
}

export type Icons = Array<{
	sizes?: string;
	src: string;
	type?: string;
	purpose?: 'monochrome' | 'maskable' | 'any' | (string & {}) | ('monochrome' | 'maskable' | 'any')[];
}>

/**
 * Generates all icons (favicon, apple touch icon, manifest icons).
 *
 * @param options Generation options.
 * @trows if favicon or logos are not found.
 */
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

// ============================================
// THEME
// ============================================

const themeSchema = z.object({
	brand: z.object({
		color: z.string(),
		colorLight: z.string(),
		colorLighter: z.string(),
		colorDark: z.string(),
		colorDarker: z.string(),
	}).strict(),
});

export type ThemeConfig = z.infer<typeof themeSchema>;

export function allThemeConfigPaths(sourceDir: string): Record<string, string> {
	return {
		customPath: path.join(sourceDir, 'custom', 'theme.json'),
		defaultPath: path.join(sourceDir, 'default', 'theme.json'),
	}
}

export function getThemeFile(path: string): ThemeConfig {
	const raw = fs.readFileSync(path, 'utf8');
	const theme = themeSchema.parse(JSON.parse(raw));

	return theme;
}

export type GenerateThemeOptions = {
	/**
	 * Source branding directory.
	 */
	sourceDir: string;
}

/**
 * Generates CSS theme variables from theme.json.
 */
export function generateThemeCSS({ sourceDir }: GenerateThemeOptions): string {
	const configPath = (() => {
		const { customPath, defaultPath } = allThemeConfigPaths(sourceDir);

		if (fs.existsSync(customPath)) return customPath;
		if (fs.existsSync(defaultPath)) return defaultPath;
		return null;
	})();

	if (!configPath) {
		console.warn('No theme.json found. Generating empty theme block');
		return `:root {}`;
	}

	console.log(
		`Using theme config: ${path.relative(
			process.cwd(),
			configPath
		)}`
	);

	const theme = getThemeFile(configPath);

	const rootVars: string[] = [];

	// Generate variables for each group (example: "brand")
	Object.entries(theme).forEach(([groupName, groupValues]) => {
		if (!groupValues || typeof groupValues !== 'object') return;

		Object.entries(groupValues).forEach(([key, value]) => {
			const groupKebab = groupName.replace(/([A-Z])/g, '-$1').toLowerCase();
			const keyKebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			rootVars.push(`  --theme-${groupKebab}-${keyKebab}: ${value};`);
		});
	});

	return `
:root {
${rootVars.join('\n')}
}
`.trim();
}

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Parses a color string into RGB components.
 *
 * Supports:
 * - rgb(), rgba()
 * - hex (#rrggbb, #rgb)
 * - hsl(), hsla()
 *
 * @param input Color string.
 * @throws if the color is invalid.
 */
export function parseColorToRgb(input: string): RGB | null {
	const rgb = /^rgba?\(\s*(?<r>25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(?<g>25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(?<b>25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,?\s*(?<alpha>[01\.]\.?\d?)?\s*\)$/i.exec(input);
	const hex = /^\B#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/i.exec(input);
	const hsl = /^hsla?\(\s*(?<h>[-+]?\d{1,3}(?:\.\d+)?)(deg|grad|rad|turn)?\s*(?:,\s*|\s+)\s*(?<s>[-+]?\d{1,3}(?:\.\d+)?)%\s*(?:,\s*|\s+)\s*(?<l>[-+]?\d{1,3}(?:\.\d+)?)%\s*(?:,\s*|\s+)?(?:\s*\/?\s*(?<alpha>[-+]?[\d.]+%?)\s*)?\)$/i.exec(input);

	if (rgb) {
		if (!rgb.groups) {
			throw new Error("Invalid RGB color");
		}

		return [
			parseInt(rgb.groups.r),
			parseInt(rgb.groups.g),
			parseInt(rgb.groups.b),
		];
	}

	if (hex) {
		return convert.hex.rgb(input);
	}

	if (hsl) {
		if (!hsl.groups) {
			throw new Error("Invalid HSL color");
		}

		return convert.hsl.rgb(
			parseInt(hsl.groups.h),
			parseInt(hsl.groups.s),
			parseInt(hsl.groups.l),
		);
	}

	return null;
}

/**
 * Determines the optimal foreground color (black or white) for readability
 * against the given background color.
 *
 * @param rgb Background color in RGB format.
 */
export function getOptimalForegroundColor(rgb: RGB): string {
	const correctedRgb = [];
	for (const [index, component] of rgb.entries()) {
		const normalizedComponent = component / 255;

		if (normalizedComponent <= 0.03928) {
			correctedRgb[index] = normalizedComponent / 12.92;
		}

		correctedRgb[index] =  Math.pow((normalizedComponent + 0.055) / 1.055, 2.4);
	}

	const [red, green, blue] = correctedRgb;
	const relativeLuminance = 0.2126 * red + 0.7151 * green + 0.0721 * blue;

	const contrastRatioForBlack = (relativeLuminance + 0.05) / 0.05;
	const contrastRatioForWhite = 1.05 / (relativeLuminance + 0.05);

	return contrastRatioForBlack > contrastRatioForWhite ? "hsl(220 20% 5.7%)" : "hsl(0 0% 100%)";
}

// ============================================
// METADATA IMAGE
// ============================================

type MetadataImageOptions = {
	title: string;
}

/**
 * Generates a metadata image based on branding and theme.
 */
export class MetadataImage {
	// Image dimensions
	private static readonly IMAGE_WIDTH = 1200;
	private static readonly IMAGE_HEIGHT = 628;
	private static readonly LOGO_SIZE = 250;
	private static readonly MARGIN = 100;

	// Typography
	private static readonly BASE_FONT_SIZE = 100;
	private static readonly LARGE_FONT_SIZE = 120;
	private static readonly LINE_MARGIN = 20;
	private static readonly MAX_TITLE_LENGTH = 12;
	private static readonly SHORT_TITLE_THRESHOLD = 8;

	private static readonly FONTCONFIG_XML = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
	<dir prefix="relative">./</dir>
	<config></config>
</fontconfig>
`;

	private static fontsConfDirName = "fonts";

	public static getFontsConfigDir(baseDir: string): string {
		const fontsConfDir = path.resolve(baseDir, this.fontsConfDirName);
		process.env.FONTCONFIG_PATH = fontsConfDir;

		return fontsConfDir;
	}

	/**
	 * Check if `baseDir` contains the files required for a font environment.
	 */
	public static async hasFontsEnvironment(baseDir: string): Promise<boolean> {
		const fontsConfDir = this.getFontsConfigDir(baseDir);

		try {
			const dir = await readdir(fontsConfDir);

			if (!dir.includes("fonts.conf")) return false;
			if (dir.filter((name) => name.endsWith(".ttf")).length < 1) return false;

			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Sets up a self-contained font environment.
	 */
	public static async setupFontsEnvironment(baseDir: string) {
		const fontsConfDir = this.getFontsConfigDir(baseDir);

		await mkdir(fontsConfDir, { recursive: true });

		const fontUrls = [
			"https://cdn.jsdelivr.net/fontsource/fonts/inter@5.2.8/latin-600-normal.ttf",
		];

		for (const fontUrl of fontUrls) {
			const res = await fetch(fontUrl);
			if (!res.ok) {
				throw new Error(`Failed to fetch font: ${res.status} ${res.statusText}`);
			}

			const fontBuffer = Buffer.from(await res.arrayBuffer());

			await writeFile(path.join(fontsConfDir, path.basename(fontUrl)), fontBuffer);
			console.log(`Font written: ${path.join(fontsConfDir, path.basename(fontUrl))}`);
		}

		await writeFile(path.join(fontsConfDir, "fonts.conf"), MetadataImage.FONTCONFIG_XML);
	}

	/**
	 * Generates a metadata image PNG buffer based on branding and theme.
	 *
	 * @throws if logo or theme files are missing or invalid.
	 */
	public static async generateMetadataImage({ title }: MetadataImageOptions): Promise<{ type: string; source: Buffer; }> {
		const sourceDir = path.resolve("branding");

		const logoFile = findLogoFile(sourceDir, "logo_dark");
		if (!logoFile) {
			throw new Error("Logo not found");
		}

		if (!title) {
			throw new Error("No titleset");
		}

		const themeFile = findBrandingFile(sourceDir, "theme.json");
		if (!themeFile) {
			throw new Error("theme.json not found");
		}

		const theme = getThemeFile(themeFile.pathname);

		const backgroundColor = theme.brand.color;

		const backgroundColorRgb = parseColorToRgb(backgroundColor);
		if (!backgroundColorRgb) {
			throw new Error("Invalid brand color");
		}

		const textColor = getOptimalForegroundColor(backgroundColorRgb);

		const logoB64 = (
			await sharp(logoFile.pathname).png().toBuffer()
		).toString("base64");

		const svg = this.createSvgTemplate(
			title,
			`image/png;base64,${logoB64}`,
			{ background: backgroundColor, text: textColor }
		);

		const svgBuffer = Buffer.from(svg);
		const pngBuffer = await sharp(svgBuffer).png().toBuffer()

		return {
			type: "image/png",
			source: pngBuffer,
		}
	}

	private static wrapTextToLines(text: string, maxLineLength: number): string[] {
		const lines: string[] = [];
		let remainingText = text;

		while (remainingText.length > 0) {
			if (remainingText.length <= maxLineLength) {
				lines.push(remainingText);
				break;
			}

			const lastSpace = remainingText.lastIndexOf(" ", maxLineLength);
			const splitIndex = lastSpace === -1 ? maxLineLength : lastSpace;

			lines.push(remainingText.substring(0, splitIndex));
			remainingText = remainingText.substring(
				splitIndex + (lastSpace === -1 ? 0 : 1)
			);
		}

		return lines;
	}

	private static createSvgTemplate(title: string, logoB64: string, colors: { background: string; text: string }): string {
		// Calculate title layout
		const lines = this.wrapTextToLines(title, this.MAX_TITLE_LENGTH);
		const fontSize = title.length <= this.SHORT_TITLE_THRESHOLD ? this.LARGE_FONT_SIZE : this.BASE_FONT_SIZE;
		const lineHeight = (fontSize * 0.8) + this.LINE_MARGIN;
		const titleHeight = (lines.length * lineHeight) - this.LINE_MARGIN;

		// Build title tspans
		const tspans = lines
			.map((line, index) => `<tspan x="0" ${index > 0 ? `dy="${lineHeight}"` : ""}>${line}</tspan>`)
			.join("");

		// Calculate logo position
		const logoY = (this.IMAGE_HEIGHT / 2) - (this.LOGO_SIZE / 2);
		const logoX = this.IMAGE_WIDTH - this.MARGIN - this.LOGO_SIZE;

		return `
<svg width="${this.IMAGE_WIDTH}" height="${this.IMAGE_HEIGHT}" viewBox="0 0 ${this.IMAGE_WIDTH} ${this.IMAGE_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
	<rect x="0" y="0" width="${this.IMAGE_WIDTH}" height="${this.IMAGE_HEIGHT}" fill="${colors.background}" />
	<image y="${logoY}" x="${logoX}" width="${this.LOGO_SIZE}" height="${this.LOGO_SIZE}" xlink:href="data:${logoB64}" />
	<g fill="${colors.text}" font-family="Inter SemiBold">
		<svg x="${this.MARGIN}" y="50%" transform="translate(0 ${-(titleHeight / 2)})">
			<text y="1" dominant-baseline="hanging" font-size="${fontSize}">
				${tspans}
			</text>
		</svg>
	</g>
</svg>
`;
	}
}
