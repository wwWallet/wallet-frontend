import path from "node:path";
import { Plugin } from "vite";
import sharp from "sharp";
import convert, { RGB } from "color-convert"
import { findBrandingFile, findLogoFile } from "./manifest";
import { getThemeFile } from "./theme";

type Env = Record<string, string|null|undefined>;

const titleTemplate = (title: string, maxLength = 16, isFirstLine = true): string => {
	if (title.length <= maxLength) {
		return `<tspan x="48" ${isFirstLine ? "" : 'dy="1em"'}>${title}</tspan>`;
	}
	const lastSpace = title.lastIndexOf(" ", maxLength);

	const firstLine = lastSpace === -1 ? title.substring(0, maxLength) : title.substring(0, lastSpace);
	const remaining = lastSpace === -1 ? title.substring(maxLength) : title.substring(lastSpace + 1);

	return (
		`<tspan x="48" ${isFirstLine ? "" : 'dy="1em"'}>${firstLine}</tspan>` +
		titleTemplate(remaining, maxLength, false)
	);
};

type ImageTemplateProps = {
	title: string;
	url: string;
	logoB64: string;
	colors: {
		background: string;
		text: string;
	}
}

const imageTemplate = ({ title, url, logoB64, colors }: ImageTemplateProps) => `
<svg width="1200" height="628" viewBox="0 0 1200 628" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
	<style>
		.header {
			dominant-baseline: hanging;
		}
		.footer {
			dominant-baseline: alphabetic;
		}
	</style>
	<rect x="0" y="0" width="1200" height="628" fill="${colors.background}" />
	<g class="header">
		<text x="48" y="88" fill="${colors.text}" font-family="Arial" font-weight="bold" font-size="100">
			${titleTemplate(title)}
		</text>
	</g>
	<g class="footer">
		<text x="48" y="540" fill="${colors.text}" font-family="Arial" font-weight="bold" font-size="40">
			${url}
		</text>
		<image
			width="150" height="150"
			x="1002" y="440"
			xlink:href="data:${logoB64}"
		/>
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

	return contrastRatioForBlack > contrastRatioForWhite ? '#000000' : '#ffffff';
}

async function generateMetadataImage(env: Env) {
	const sourceDir = path.resolve("branding");
	const publicDir = path.resolve("public");

	const logoFile = findLogoFile(sourceDir, "logo_dark");
	if (!logoFile) {
		throw new Error("[Metadata Image plugin] logo not found");
	}

	const title = env.VITE_STATIC_NAME;
	if (!title) {
		throw new Error("[Metadata Image plugin] VITE_STATIC_NAME not set");
	}

	const url = env.VITE_STATIC_PUBLIC_URL;
	if (!url) {
		throw new Error("[Metadata Image plugin] VITE_STATIC_PUBLIC_URL not set");
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

	const imageBuffer = Buffer.from(imageTemplate({
		title,
		url,
		colors: {
			background: backgroundColor,
			text: textColor,
		},
		logoB64: `image/png;base64,${logoB64}`,
	}));

	await sharp(imageBuffer).png().toFile(path.join(publicDir, "image.png"));
}

export function MetadataImagePlugin(env: Env): Plugin {
	return {
		name: "metadata-image-plugin",

		async configureServer(server) {
			// For dev
			await generateMetadataImage(env);

			server.watcher.on("change", async (file: string) => {
				file = path.relative(process.cwd(), file);

				if (file.endsWith(".env") || file.startsWith("branding")) {
					console.log("Environment file changed. Regenerating metadata image...");
					await generateMetadataImage(env);
				}
			});
		},
		async buildStart() {
			// For builds
			await generateMetadataImage(env);
		},
	}
}
