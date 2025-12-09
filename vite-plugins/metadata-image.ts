import path from "node:path";
import { Plugin } from "vite";
import sharp from "sharp";
import { findLogoFile } from "./manifest";

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

	const logoB64 = (
		await sharp(logoFile.pathname).png().toBuffer()
	).toString("base64");

	const imageBuffer = Buffer.from(imageTemplate({
		title,
		url,
		// TODO: Get colors dynamically from theme.
		colors: {
			background: "white",
			text: "black",
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
