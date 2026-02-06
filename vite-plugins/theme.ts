// vite-plugins/theme.ts
import path from 'path';
import { allThemeConfigPaths, generateThemeCSS } from '../branding';

export function ThemePlugin() {
	const brandingDir = path.resolve('branding');
	const watchedFiles = Object.values(allThemeConfigPaths(brandingDir));

	return {
		name: 'style-theme-plugin',

		// Watch theme.json files and trigger full reload when they change (dev only)
		configureServer(server: any) {
			server.watcher.add(watchedFiles);

			server.watcher.on('change', (file: string) => {
				if (watchedFiles.includes(path.resolve(file))) {
					console.log(
						'[ThemePlugin] Theme config changed. Triggering full reload...'
					);
					server.ws.send({ type: 'full-reload' });
				}
			});
		},

		// Inject generated CSS directly into src/index.css
		transform(code: string, id: string) {
			// Normalize id & strip Vite query params
			const normalizedId = id.split('?')[0].replace(/\\/g, '/');

			// Adjust path if your entry CSS changes
			if (normalizedId.endsWith('src/index.css')) {
				const themeCss = generateThemeCSS({ sourceDir: brandingDir });

				// Add theme variables at the start of index.css
				return `/* Generated theme tokens */\n\n${themeCss}\n\n${code}`;
			}

			return code;
		},
	};
}
