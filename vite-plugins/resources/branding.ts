import path from "node:path";
import fs from "node:fs";
import { z } from "zod";

export type BrandingFile = {
	/** The path where the file is located. */
	readonly pathname: string;

	/** The name of the file, including its extension. */
	readonly filename: string;

	/** Indicates whether this file is the default branding file. */
	readonly isDefault: boolean;

	/** Indicates whether this file is a custom branding file. */
	readonly isCustom: boolean;

	/**
	 * An array containing all possible pathnames for this file,
	 * including both custom and default paths.
	 * Use this only for watching file changes and similar tasks.
	 */
	readonly allPossiblePathnames: string[];
};


export function findBrandingFile(baseDir: string, filePath: string): BrandingFile | null {
	const defaultPathname = path.join(baseDir, "default", filePath);
	const customPathname = path.join(baseDir, "custom", filePath);

	const hasDefault = fs.existsSync(defaultPathname);
	const hasCustom = fs.existsSync(customPathname);

	if (!hasDefault && !hasCustom) {
		return null;
	}

	const pathname = hasCustom ? customPathname : defaultPathname;
	const filename = path.basename(pathname);

	return {
		pathname,
		filename,
		allPossiblePathnames: [defaultPathname, customPathname],
		isDefault: hasDefault && !hasCustom,
		isCustom: hasCustom,
	}
}

/** @deprecated */
export function deprecated_findBrandingFile(filePathInput: string): BrandingFile | null {
	const customPathname = path.join(
		path.dirname(filePathInput), "custom", path.basename(filePathInput)
	);

	const hasDefault = fs.existsSync(filePathInput);
	const hasCustom = fs.existsSync(customPathname);

	if (!hasDefault && !hasCustom) {
		return null;
	}

	const pathname = hasCustom ? customPathname : filePathInput;
	const filename = path.basename(pathname);

	console.warn(`Deprecation Warning: Branding file found at: ${pathname}. This is no longer supported.`);

	return {
		pathname,
		filename,
		allPossiblePathnames: [filePathInput, customPathname],
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

export function findThemeFile(baseDir: string): BrandingFile | null {
	return findBrandingFile(baseDir, 'theme.json');
}

const themeSchema = z.object({
	brand: z.object({
		color: z.string(),
		colorLight: z.string(),
		colorLighter: z.string(),
		colorDark: z.string(),
		colorDarker: z.string(),
	}).strict(),
});

type ThemeConfig = z.infer<typeof themeSchema>;

export function getThemeConfig(path: string): ThemeConfig {
	const raw = fs.readFileSync(path, 'utf8');
	const theme = themeSchema.parse(JSON.parse(raw));

	return theme;
}

// Screenshots (branding/custom/screenshots → branding/default/screenshots)
export function findScreenshotFile(sourceDir: string, filename: string): string {
	const customFile = path.join(sourceDir, "custom", "screenshots", filename);
	const defaultFile = path.join(sourceDir, "default", "screenshots", filename);

	if (fs.existsSync(customFile)) return customFile;
	if (fs.existsSync(defaultFile)) return defaultFile;

	throw new Error(`Screenshot not found: ${filename}`);
}
