// vite-plugins/theme.ts
import fs from 'fs';
import path from 'path';

type ThemeConfig = {
	light?: {
		background?: string;
	};
	dark?: {
		background?: string;
	};
	[group: string]: any;
};

function generateStyleTheme(): string {
	const configPath = path.resolve('branding/style/theme.json');

	if (!fs.existsSync(configPath)) {
		console.warn('[StyleThemePlugin] branding/style/theme.json not found, generating empty theme.css');
		return `:root{}\nhtml.dark{}`;
	}

	const raw = fs.readFileSync(configPath, 'utf8');
	const theme = JSON.parse(raw) as ThemeConfig;

	const light = theme.light ?? {};
	const dark = theme.dark ?? {};

	const rootVars: string[] = [];
	const darkVars: string[] = [];

	// Base tokens
	if (light.background) rootVars.push(`  --color-background: ${light.background};`);
	if (dark.background) darkVars.push(`  --color-background: ${dark.background};`);

	// Extra groups, e.g. "brand" -> --w-brand-color, --w-brand-color-light, ...
	Object.entries(theme).forEach(([groupName, groupValues]) => {
		if (groupName === 'light' || groupName === 'dark') return;
		if (!groupValues || typeof groupValues !== 'object') return;

		Object.entries(groupValues as Record<string, string>).forEach(([key, value]) => {
			const groupKebab = groupName.replace(/([A-Z])/g, '-$1').toLowerCase();
			const keyKebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
			const varName = `--w-${groupKebab}-${keyKebab}`;
			rootVars.push(`  ${varName}: ${value};`);
		});
	});

	return `
:root {
${rootVars.join('\n')}
}

html.dark {
${darkVars.join('\n')}
}
`.trim();
}

export function StyleThemePlugin() {
	return {
		name: 'style-theme-plugin',

		async configureServer(server) {
			const themeCssPath = path.resolve('public/theme.css');
			fs.writeFileSync(themeCssPath, generateStyleTheme(), 'utf8');
			console.log('[StyleThemePlugin] Wrote public/theme.css (dev)');

			server.watcher.on('change', (file: string) => {
				if (file.endsWith('branding/style/theme.json')) {
					console.log('[StyleThemePlugin] theme.json changed. Regenerating public/theme.css...');
					fs.writeFileSync(themeCssPath, generateStyleTheme(), 'utf8');
				}
			});
		},

		async buildStart() {
			const themeCssPath = path.resolve('public/theme.css');
			fs.writeFileSync(themeCssPath, generateStyleTheme(), 'utf8');
			console.log('[StyleThemePlugin] Wrote public/theme.css (build)');
		},
	};
}
