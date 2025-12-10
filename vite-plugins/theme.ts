// vite-plugins/theme.ts
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { findThemeFile, getThemeConfig } from './resources/branding';
import { BRANDING_DIR } from './resources/dirs';


function generateTheme(): string {
	const configPath = findThemeFile(BRANDING_DIR);

	if (!configPath) {
		console.warn('[ThemePlugin] No theme.json found. Generating empty theme block');
		return `:root {}`;
	}

	console.log(
		`[ThemePlugin] Using theme config: ${path.relative(
			process.cwd(),
			configPath.pathname
		)}`
	);

	const theme = getThemeConfig(configPath.pathname);

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

export function ThemePlugin() {
	const themeFile = findThemeFile(BRANDING_DIR);

	if (!themeFile) {
		throw new Error('[ThemePlugin] No theme.json file found');
	}

	const watchedFiles = themeFile?.allPossiblePathnames;

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
				const themeCss = generateTheme();

				// Add theme variables at the start of index.css
				return `/* Generated theme tokens */\n\n${themeCss}\n\n${code}`;
			}

			return code;
		},
	};
}
