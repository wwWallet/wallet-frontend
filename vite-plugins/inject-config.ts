import { resolve } from 'node:path';
import { Plugin } from 'vite';
import { EnvConfigMapSchema, getBrandingHash, injectConfigFiles, injectHtml } from '../config';
import { Tag } from '../config/utils/resources';

export function InjectConfigPlugin(env: Record<string, string>): Plugin {
	const config = EnvConfigMapSchema.parse(env);

	const tagsToInject = new Map<string, Tag>();

	const brandingHash = getBrandingHash(resolve('branding')); // Compute branding hash from your branding folder
	process.env.BRANDING_HASH = brandingHash; // import.meta.env.BRANDING_HASH works in TS/JS
	env.BRANDING_HASH = brandingHash; // BRANDING_HASH% works in index.html

	const runInjectConfigFiles = () => injectConfigFiles({
		destDir: resolve('public'),
		config,
		tagsToInject,
	});

	return {
		name: 'inject-config',
		transformIndexHtml: {
			order: 'pre',
			async handler(html) {
				html = await injectHtml({
					html,
					config,
					brandingHash: env.BRANDING_HASH,
					tagsToInject,
				})

				return {
					html,
					tags: [], // No additional tags to inject since we're directly modifying the HTML string
				}
			},
		},
		async buildStart() {
			await runInjectConfigFiles();
		},
		async configureServer(server) {
			await runInjectConfigFiles();

			server.watcher.on('change', async (file) => {
				if (file.endsWith('.env')) {
					console.log('Environment file changed. Reinjecting config...');
					await runInjectConfigFiles();
				}
			});
		},
	};
}
