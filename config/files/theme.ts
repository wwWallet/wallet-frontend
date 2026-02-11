import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { generateThemeCSS } from '../../branding';

export default async function themeCSS(destDir: string) {
	const themeCss = generateThemeCSS({
		sourceDir: resolve('branding')
	});

	await writeFile(
		resolve(destDir, `theme.css`),
		themeCss,
		'utf-8',
	);
}
