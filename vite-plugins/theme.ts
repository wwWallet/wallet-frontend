// vite-plugins/theme.ts
import fs from 'fs';
import path from 'path';

type ThemeConfig = {
	[group: string]: Record<string, string>;
};

const BASE_THEME_PATH = path.resolve("branding/default/theme.json");
const CUSTOM_THEME_PATH = path.resolve("branding/custom/theme.json");

function resolveThemeConfigPath(): string | null {
	if (fs.existsSync(CUSTOM_THEME_PATH)) return CUSTOM_THEME_PATH;
	if (fs.existsSync(BASE_THEME_PATH)) return BASE_THEME_PATH;
	return null;
}

function generateStyleTheme(): string {
	const configPath = resolveThemeConfigPath();

	if (!configPath) {
		console.warn(
			"[ThemePlugin] No theme.json found. Generating empty theme.css"
		);
		return `:root {}`;
	}

	console.log(
		`[ThemePlugin] Using theme config: ${path.relative(
			process.cwd(),
			configPath
		)}`
	);

	const raw = fs.readFileSync(configPath, "utf8");
	const theme = JSON.parse(raw) as ThemeConfig;

	const rootVars: string[] = [];

	// Generate variables for each group (example: "brand")
	Object.entries(theme).forEach(([groupName, groupValues]) => {
		if (!groupValues || typeof groupValues !== "object") return;

		Object.entries(groupValues).forEach(([key, value]) => {
			const groupKebab = groupName.replace(/([A-Z])/g, "-$1").toLowerCase();
			const keyKebab = key.replace(/([A-Z])/g, "-$1").toLowerCase();
			rootVars.push(`  --w-${groupKebab}-${keyKebab}: ${value};`);
		});
	});

	return `
:root {
${rootVars.join("\n")}
}
`.trim();
}

export function ThemePlugin() {
	return {
		name: "style-theme-plugin",

		async configureServer(server) {
			const themeCssPath = path.resolve("public/theme.css");
			fs.writeFileSync(themeCssPath, generateStyleTheme(), "utf8");
			console.log("[ThemePlugin] Wrote public/theme.css (dev)");

			const watchedFiles = [BASE_THEME_PATH, CUSTOM_THEME_PATH];
			server.watcher.add(watchedFiles);

			server.watcher.on("change", (file: string) => {
				if (watchedFiles.includes(path.resolve(file))) {
					console.log(
						"[ThemePlugin] Theme config changed. Regenerating public/theme.css..."
					);
					fs.writeFileSync(themeCssPath, generateStyleTheme(), "utf8");
				}
			});
		},

		async buildStart() {
			const themeCssPath = path.resolve("public/theme.css");
			fs.writeFileSync(themeCssPath, generateStyleTheme(), "utf8");
			console.log("[ThemePlugin] Wrote public/theme.css (build)");
		},
	};
}
