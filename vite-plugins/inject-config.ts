import { resolve } from 'node:path';
import { Plugin } from 'vite';
import { getConfigFromEnv, injectConfigFiles, injectHtml } from '../config';

export function InjectConfigPlugin(env: Record<string, string>): Plugin {
	const config = getConfigFromEnv(env);

	const runInjectConfigFiles = () => injectConfigFiles({
		destDir: resolve('public'),
		config,
	});

	return {
		name: 'inject-config',
		transformIndexHtml: {
			order: 'post',
			async handler(html) {
				html = await injectHtml({
					html,
					config,
					brandingHash: env.VITE_BRANDING_HASH,
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
