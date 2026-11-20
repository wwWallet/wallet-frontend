import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { generateThemeCSS } from '../branding.ts';
import type { TagsMap } from '../utils/resources.ts';
import { pathWithBase } from '../utils/paths.ts';
import type { EnvConfigMap } from '../config.ts';

export default async function themeCSS(
	destDir: string,
	config: EnvConfigMap,
	tagsToInject?: TagsMap,
	brandingHash?: string,
) {
	const themeCss = generateThemeCSS({
		sourceDir: resolve('branding'),
	});

	await writeFile(resolve(destDir, `theme.css`), themeCss, 'utf-8');

	tagsToInject?.set('theme-css', {
		tag: 'link',
		props: {
			rel: 'stylesheet',
			href: pathWithBase(config.BASE_PATH, `theme.css?v=${brandingHash}`),
		},
	});
	tagsToInject?.set('theme-color-light', {
		tag: 'meta',
		props: {
			name: 'theme-color',
			media: '(prefers-color-scheme: light)',
			content: '#ffffff',
		},
	});
	tagsToInject?.set('theme-color-dark', {
		tag: 'meta',
		props: {
			name: 'theme-color',
			media: '(prefers-color-scheme: dark)',
			content: '#0c0e11',
		},
	});
}
