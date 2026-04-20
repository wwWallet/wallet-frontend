import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { generateThemeCSS } from '../branding';
import { TagsMap } from '../utils/resources';
import { pathWithBase } from '../utils/paths';
import { EnvConfigMap } from '../config';

export default async function themeCSS(destDir: string, config: EnvConfigMap, tagsToInject?: TagsMap, brandingHash?: string) {
	const themeCss = generateThemeCSS({
		sourceDir: resolve('branding')
	});

	await writeFile(
		resolve(destDir, `theme.css`),
		themeCss,
		'utf-8',
	);

	tagsToInject?.set('theme-css', {
		tag: 'link',
		props: {
			rel: 'stylesheet',
			href: pathWithBase(config.BASE_PATH, `theme.css?v=${brandingHash}`)
		}
	});
	tagsToInject?.set('theme-color-light', {
		tag: 'meta',
		props: {
			name: 'theme-color',
			media: '(prefers-color-scheme: light)',
			content: '#f8f9f9'
		}
	});
	tagsToInject?.set('theme-color-dark', {
		tag: 'meta',
		props: {
			name: 'theme-color',
			media: '(prefers-color-scheme: dark)',
			content: '#0c0e11'
		}
	});
}
