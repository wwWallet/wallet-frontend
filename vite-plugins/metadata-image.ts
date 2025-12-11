import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { Plugin } from "vite";
import sharp from "sharp";
import convert, { RGB } from "color-convert"
import { createFont, woff2 } from "fonteditor-core";
import { findBrandingFile, findLogoFile } from "./brandingManifest";
import { getThemeFile } from "./theme";

type Env = Record<string, string|null|undefined>;

const fontsConfTemplate = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
	<dir prefix="relative">./</dir>
	<config></config>
</fontconfig>
`;

/**
 * Sets up a self-contained font environment:
 * 1. Converts a WOFF2 font to TTF for Node rendering.
 * 2. Writes the font and a minimal Fontconfig XML to a project directory.
 * 3. Sets FONTCONFIG_PATH so rendering libraries can find the font.
 *
 * The reason for converting from WOFF2 to TTF is so we can keep using the
 * `@fontsource/inter` package and not need to bundle font files.
 */
async function setupFontsEnvironment(baseDir: string) {
	const fontsConfDir = path.resolve(baseDir, "fonts");
	const inputFontFiles = [
		import.meta.resolve("@fontsource/inter/files/inter-latin-600-normal.woff2"),
	];

	await woff2.init();
	await mkdir(fontsConfDir, { recursive: true });

	for (const input of inputFontFiles) {
		const inputBuffer = await readFile(fileURLToPath(input));

		const font = createFont(inputBuffer, {
			type: "woff2",
			hinting: true,
			kerning: true,
		});

		const outputBuffer = font.write({
			type: "ttf",
			hinting: true,
			kerning: true,
		});

		await writeFile(path.join(fontsConfDir, path.basename(input)), outputBuffer as Buffer);
	}

	await writeFile(path.join(fontsConfDir, "fonts.conf"), fontsConfTemplate),

	process.env.FONTCONFIG_PATH = fontsConfDir;
}

function splitTitle(title: string, maxLength: number): string[] {
	const lines: string[] = [];
	let remainingTitle = title;

	while (remainingTitle.length > 0) {
		if (remainingTitle.length <= maxLength) {
			lines.push(remainingTitle);
			break;
		}

		const lastSpace = remainingTitle.lastIndexOf(" ", maxLength);
		const splitIndex = lastSpace === -1 ? maxLength : lastSpace;

		lines.push(remainingTitle.substring(0, splitIndex));
		remainingTitle = remainingTitle.substring(
			splitIndex + (lastSpace === -1 ? 0 : 1)
		);
	}

	return lines;
};

const createTspan = (content: string, dy: number, isFirstLine: boolean): string =>
	`<tspan x="0" ${!isFirstLine ? `dy="${dy}"` : ""}>${content}</tspan>`;

const titleTemplate = (title: string, maxLength: number = 12): string => {
	const lines = splitTitle(title, maxLength);
	const fontSize = title.length <= 8 ? 120 : 100;
	const lineMargin = 20;
	const lineHeight = (fontSize * 0.8) + lineMargin;
	const titleHeight = (lines.length * lineHeight) - lineMargin;

	return `
		<svg x="100" y="50%" transform="translate(0 ${-(titleHeight / 2)})">
			<text y="1" dominant-baseline="hanging" font-size="${fontSize}">
				${lines
					.map((line, index) => createTspan(line, lineHeight, index === 0))
					.join("")
				}
			</text>
		</svg>
	`;
};

const logoTemplate = (b64String: string, size: number = 250) => `
<image
	y="${(628 / 2) - (size / 2)}"
	x="${1200 - 100 - size}"
	width="${size}"
	height="${size}"
	xlink:href="data:${b64String}"
/>
`;

type ImageTemplateProps = {
	title: string;
	logoB64: string;
	colors: {
		background: string;
		text: string;
	}
}
const imageTemplate = ({ title, logoB64, colors }: ImageTemplateProps) => `
<svg width="1200" height="628" viewBox="0 0 1200 628" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
	<rect x="0" y="0" width="1200" height="628" fill="${colors.background}" />
	${logoTemplate(logoB64, 250)}
	<g fill="${colors.text}" font-family="Inter SemiBold">
		${titleTemplate(title)}
	</g>
</svg>
`;

function toRgb(input: string): RGB | null {
	const rgb = /^rgba?\(\s*(?<r>25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(?<g>25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(?<b>25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,?\s*(?<alpha>[01\.]\.?\d?)?\s*\)$/i.exec(input);
	const hex = /^\B#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/i.exec(input);
	const hsl = /^hsla?\(\s*(?<h>[-+]?\d{1,3}(?:\.\d+)?)(deg|grad|rad|turn)?\s*(?:,\s*|\s+)\s*(?<s>[-+]?\d{1,3}(?:\.\d+)?)%\s*(?:,\s*|\s+)\s*(?<l>[-+]?\d{1,3}(?:\.\d+)?)%\s*(?:,\s*|\s+)?(?:\s*\/?\s*(?<alpha>[-+]?[\d.]+%?)\s*)?\)$/i.exec(input);

	if (rgb) {
		if (!rgb.groups) {
			throw new Error("[Metadata Image plugin] Invalid RGB");
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
			throw new Error("[Metadata Image plugin] Invalid HSL");
		}

		return convert.hsl.rgb(
			parseInt(hsl.groups.h),
			parseInt(hsl.groups.s),
			parseInt(hsl.groups.l),
		);
	}

	return null;
}

function getOptimalForegroundColor(rgb: RGB): string {
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

async function generateMetadataImage(env: Env): Promise<{ type: string; source: Buffer; }> {
	const sourceDir = path.resolve("branding");

	const logoFile = findLogoFile(sourceDir, "logo_dark");
	if (!logoFile) {
		throw new Error("[Metadata Image plugin] logo not found");
	}

	const title = env.VITE_STATIC_NAME;
	if (!title) {
		throw new Error("[Metadata Image plugin] VITE_STATIC_NAME not set");
	}

	const themeFile = findBrandingFile(sourceDir, "theme.json");
	if (!themeFile) {
		throw new Error("[Metadata Image plugin] theme.json not found");
	}

	const theme = getThemeFile(themeFile.pathname);

	const backgroundColor = theme.brand.color;

	const backgroundColorRgb = toRgb(backgroundColor);
	if (!backgroundColorRgb) {
		throw new Error("[Metadata Image plugin] invalid brand color");
	}

	const textColor = getOptimalForegroundColor(backgroundColorRgb);

	const logoB64 = (
		await sharp(logoFile.pathname).png().toBuffer()
	).toString("base64");

	const svg = imageTemplate({
		title,
		colors: {
			background: backgroundColor,
			text: textColor,
		},
		logoB64: `image/png;base64,${logoB64}`,
	});

	const svgBuffer = Buffer.from(svg);
	const pngBuffer = await sharp(svgBuffer).png().toBuffer()

	return {
		type: "image/png",
		source: pngBuffer,
	}
}

export function MetadataImagePlugin(env: Env): Plugin {
	const fileName = "image.png";

	return {
		name: "metadata-image-plugin",

		async configResolved(config) {
			await setupFontsEnvironment(config.cacheDir);
		},
		async configureServer(server) {
			let image = await generateMetadataImage(env);

			server.watcher.on("change", async(file: string) => {
				if (["theme.json", "logo_dark.svg", "logo_dark.png"].includes(path.basename(file))) {
					console.log("[Metadata Image plugin] Theme config changed. Regenerating image...");

					image = await generateMetadataImage(env);
				}
			});

			server.middlewares.use(`/${fileName}`, async (req, res) => {
				res.setHeader("Content-Type", image.type);
				res.end(image.source);
			});
		},
		async generateBundle(options, bundle) {
			this.emitFile({
				type: "asset",
				fileName,
				source: (await generateMetadataImage(env)).source,
			});
		},
	}
}
