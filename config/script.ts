import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { injectConfigFiles, injectHtml } from './inject';
import { getConfigFromEnv } from './utils/config';
import { createCustomDirFromJSON } from '../branding';

/**
 * This script is responsible for generating .well-known files and injecting meta tags into the HTML based on environment variables.
 */
(async () => {
	const env = process.env as Record<string, string>;

	await injectConfigFiles({
		destDir: resolve('dist'),
		config: getConfigFromEnv(env),
	});

	const htmlFilePath = resolve('dist/index.html');
	const htmlContent = await readFile(htmlFilePath, 'utf-8');

	const updatedHtml = await injectHtml({
		html: htmlContent,
		config: getConfigFromEnv(env),
		brandingHash: env.VITE_BRANDING_HASH,
	});

	await writeFile(htmlFilePath, updatedHtml, 'utf-8');
})();

