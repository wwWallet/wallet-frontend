// vite-plugins/theme.ts
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

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

const BASE_THEME_PATH = path.resolve('branding/default/theme.json');
const CUSTOM_THEME_PATH = path.resolve('branding/custom/theme.json');

function resolveThemeConfigPath(): string | null {
	if (fs.existsSync(CUSTOM_THEME_PATH)) return CUSTOM_THEME_PATH;
	if (fs.existsSync(BASE_THEME_PATH)) return BASE_THEME_PATH;
	return null;
}

export function getThemeFile(path: string): ThemeConfig {
	const raw = fs.readFileSync(path, 'utf8');
	const theme = themeSchema.parse(JSON.parse(raw));

	return theme;
}

function generateTheme(): string {
	const configPath = resolveThemeConfigPath();

	if (!configPath) {
		console.warn('[ThemePlugin] No theme.json found. Generating empty theme block');
		return `:root {}`;
	}

	console.log(
		`[ThemePlugin] Using theme config: ${path.relative(
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

export function ThemePlugin() {
	const watchedFiles = [BASE_THEME_PATH, CUSTOM_THEME_PATH];

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
