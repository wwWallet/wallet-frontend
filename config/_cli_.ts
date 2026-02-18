import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCustomBrandingDirFromJSON, getBrandingHash } from './branding';
import { injectConfigFiles, injectHtml } from './inject';
import { getConfigFromEnv } from './config';
import { Tag } from './utils/resources';

/**
 * Entry point of the CLI script to inject configuration-dependent files and HTML meta tags.
 */
(async () => {
	const env = process.env as Record<string, string>;

	const DEST_DIR = getFlag('--dest');
	if (!DEST_DIR) {
		throw new Error('Destination directory flag --dest is required.');
	}

	const BRANDING_CUSTOM_DATA = getFlag('--branding-custom-data');

	if (BRANDING_CUSTOM_DATA) {
		await createCustomBrandingDirFromJSON(JSON.parse(BRANDING_CUSTOM_DATA));
	}

	const brandingHash = getBrandingHash(resolve('branding')); // Compute branding hash from your branding folder
	env.VITE_BRANDING_HASH = brandingHash;

	const config = getConfigFromEnv(env);

	const tagsToInject = new Map<string, Tag>();

	await injectConfigFiles({
		destDir: DEST_DIR,
		config,
		tagsToInject,
	});

	const htmlFilePath = resolve(DEST_DIR, 'index.html');
	const htmlContent = await readFile(htmlFilePath, 'utf-8');

	const updatedHtml = await injectHtml({
		html: htmlContent,
		config,
		tagsToInject,
		brandingHash,
	});

	await writeFile(htmlFilePath, updatedHtml, 'utf-8');
})();

function getFlag(flag: string): string | undefined {
	const flagIndex = process.argv.indexOf(flag);

	if (flagIndex !== -1 && flagIndex + 1 < process.argv.length) {
		const value = process.argv[flagIndex + 1];

		if (!value.startsWith('--') && value.trim() !== '') {
			return value;
		}
	}
	return undefined;
}
