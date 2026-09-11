import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findLogoFiles } from '../branding';
import { getManifestRevisionFromContent, MANIFEST_ICON_SIZES } from './manifest';

type RuntimePrecacheEntry = {
	url: string;
	revision: null;
};

const SCREENSHOT_FILES = [
	'screen_mobile_1.png',
	'screen_mobile_2.png',
	'screen_tablet_1.png',
	'screen_tablet_2.png',
];

function withVersion(pathname: string, version: string): RuntimePrecacheEntry {
	return {
		url: `./${pathname}?v=${encodeURIComponent(version)}`,
		revision: null,
	};
}

/**
 * Writes the inject-time Workbox precache entries consumed by the service worker.
 *
 * Keeping this in a separate imported worker script means a branding-only change
 * changes the service worker dependency graph without rebuilding the application.
 */
export default async function runtimePrecache(destDir: string, brandingHash: string) {
	const manifestContent = await readFile(resolve(destDir, 'manifest.json'), 'utf-8');
	const manifestRevision = getManifestRevisionFromContent(manifestContent);
	const { logo_light: logoLight, logo_dark: logoDark } = findLogoFiles(resolve('branding'));

	const iconFiles = MANIFEST_ICON_SIZES.flatMap((size) => {
		const sizeString = `${size}x${size}`;
		const files = [`icons/icon-${sizeString}.png`];

		if (size === 192 || size === 512) {
			files.push(`icons/icon-${sizeString}-maskable.png`);
		}

		return files;
	});

	const brandingFiles = [
		'theme.css',
		logoLight.filename,
		logoDark.filename,
		'favicon.ico',
		'image.png',
		'icons/apple-touch-icon.png',
		...iconFiles,
		...SCREENSHOT_FILES.map((filename) => `screenshots/${filename}`),
	];

	const entries: RuntimePrecacheEntry[] = [
		withVersion('manifest.json', manifestRevision),
		...brandingFiles.map((pathname) => withVersion(pathname, brandingHash)),
	];

	const contents = [
		'/* Generated at environment injection time. Do not edit. */',
		`self.__RUNTIME_PRECACHE_MANIFEST = ${JSON.stringify(entries, null, 2)};`,
		'',
	].join('\n');

	await writeFile(resolve(destDir, 'runtime-precache.js'), contents, 'utf-8');
}
