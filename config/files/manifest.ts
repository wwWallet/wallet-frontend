import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { copyScreenshots, generateAllIcons, Icons } from '../../branding';
import type { ManifestOptions } from 'vite-plugin-pwa';
import { type ConfigMap } from '../utils/config';

/**
 * Generates a web app manifest and icons, and injects them into the build output.
 */
export default async function brandingManifest(destDir: string, config: ConfigMap, brandingHash?: string) {
	const sourceDir = resolve('branding');

	const icons = await generateAllIcons({
		sourceDir,
		publicDir: destDir,
		manifestIconSizes: [16, 32, 64, 192, 512],
		brandingHash,
	});

	const manifest = await generateManifest({
		hash: brandingHash,
		name: config.META_STATIC_NAME || 'wwWallet',
		icons,
	});

	const manifestPath = resolve(destDir, 'manifest.json');
	const manifestContent = JSON.stringify(manifest, null, 2);

	await writeFile(manifestPath, manifestContent, 'utf-8');
	await copyScreenshots(sourceDir, destDir);
}

export type GenerateManifestOptions = {
	/**
	 * Hash to append to icon URLs for cache busting, typically derived from branding assets.
	 */
	hash?: string;
	/**
	 * Name of the app to use in the manifest. Falls back to 'wwWallet' if not provided.
	 */
	name?: string;
	/**
	 * Generated icons to include in the manifest, keyed by size (e.g. '192x192').
	 */
	icons: Icons;
};

/**
 * Generates a web app manifest based on provided options, including cache-busting for icons and screenshots.
 */
async function generateManifest({ hash, name, icons }: GenerateManifestOptions): Promise<Partial<ManifestOptions>> {
	const hashSuffix = hash ? `?v=${hash}` : '';

	return {
		'short_name': name || 'wwWallet',
		'name': name || 'wwWallet',
		'icons': icons,
		'screenshots': [
			{
				'src': `screenshots/screen_mobile_1.png${hashSuffix}`,
				'sizes': '828x1792',
				'type': 'image/png',
				'form_factor': 'narrow',
				'label': 'Home screen showing navigation and a credential'
			},
			{
				'src': `screenshots/screen_mobile_2.png${hashSuffix}`,
				'sizes': '828x1792',
				'type': 'image/png',
				'form_factor': 'narrow',
				'label': 'Credential selection view'
			},
			{
				'src': `screenshots/screen_tablet_1.png${hashSuffix}`,
				'sizes': '2160x1620',
				'type': 'image/png',
				'form_factor': 'wide',
				'label': 'Home screen showing navigation and a credential'
			},
			{
				'src': `screenshots/screen_tablet_2.png${hashSuffix}`,
				'sizes': '2160x1620',
				'type': 'image/png',
				'form_factor': 'wide',
				'label': 'Credential selection view'
			}
		],
		'start_url': '/',
		'display': 'standalone',
		'theme_color': '#111827',
		'description': `${name || 'wwWallet'} enables secure storage and management of verifiable credentials.`,
		'background_color': '#ffffff',
		'scope': '/',
		'dir': 'ltr',
		'lang': 'en'
	};
}
