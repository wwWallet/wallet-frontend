import path from "node:path";
import { Plugin } from "vite";
import { MetadataImage } from "../branding";

type Env = Record<string, string|null|undefined>;

export function MetadataImagePlugin(env: Env): Plugin {
	const fileName = "image.png";

	const generationConfig = {
		title: env.VITE_STATIC_NAME || 'wwWallet',
	};

	return {
		name: "metadata-image-plugin",

		async configResolved(config) {
			await MetadataImage.setupFontsEnvironment(config.cacheDir);
		},
		async configureServer(server) {
			let image = await MetadataImage.generateMetadataImage(generationConfig);

			server.watcher.on("change", async(file: string) => {
				if (["theme.json", "logo_dark.svg", "logo_dark.png"].includes(path.basename(file))) {
					console.log("[Metadata Image plugin] Theme config changed. Regenerating image...");

					image = await MetadataImage.generateMetadataImage(generationConfig);
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
				source: (await MetadataImage.generateMetadataImage(generationConfig)).source,
			});
		},
	}
}
