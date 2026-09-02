import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findLogoFiles, getBrandingHash } from '../branding';
import { getManifestRevisionFromContent } from './manifest';
import runtimePrecache from './runtime-precache';

type RuntimePrecacheEntry = {
	url: string;
	revision: null;
};

function parseRuntimePrecache(output: string): RuntimePrecacheEntry[] {
	const assignment = output.match(/self\.__RUNTIME_PRECACHE_MANIFEST = ([\s\S]+);\s*$/);
	expect(assignment).not.toBeNull();
	return JSON.parse(assignment![1]);
}

describe('runtimePrecache', () => {
	it('writes exact query-versioned URLs for every generated branding asset', async () => {
		const destDir = await mkdtemp(join(tmpdir(), 'wwwallet-runtime-precache-'));
		const manifestContent = JSON.stringify({ name: 'Injected Wallet' });

		try {
			await writeFile(join(destDir, 'manifest.json'), manifestContent, 'utf-8');
			await runtimePrecache(destDir, 'brand/hash');

			const output = await readFile(join(destDir, 'runtime-precache.js'), 'utf-8');
			const { logo_light: logoLight, logo_dark: logoDark } = findLogoFiles(resolve('branding'));
			const version = 'brand%2Fhash';

			expect(parseRuntimePrecache(output)).toEqual([
				{
					url: `./manifest.json?v=${getManifestRevisionFromContent(manifestContent)}`,
					revision: null,
				},
				{ url: `./theme.css?v=${version}`, revision: null },
				{ url: `./${logoLight.filename}?v=${version}`, revision: null },
				{ url: `./${logoDark.filename}?v=${version}`, revision: null },
				{ url: `./favicon.ico?v=${version}`, revision: null },
				{ url: `./image.png?v=${version}`, revision: null },
				{ url: `./icons/apple-touch-icon.png?v=${version}`, revision: null },
				{ url: `./icons/icon-16x16.png?v=${version}`, revision: null },
				{ url: `./icons/icon-32x32.png?v=${version}`, revision: null },
				{ url: `./icons/icon-64x64.png?v=${version}`, revision: null },
				{ url: `./icons/icon-192x192.png?v=${version}`, revision: null },
				{ url: `./icons/icon-192x192-maskable.png?v=${version}`, revision: null },
				{ url: `./icons/icon-512x512.png?v=${version}`, revision: null },
				{ url: `./icons/icon-512x512-maskable.png?v=${version}`, revision: null },
				{ url: `./screenshots/screen_mobile_1.png?v=${version}`, revision: null },
				{ url: `./screenshots/screen_mobile_2.png?v=${version}`, revision: null },
				{ url: `./screenshots/screen_tablet_1.png?v=${version}`, revision: null },
				{ url: `./screenshots/screen_tablet_2.png?v=${version}`, revision: null },
			]);
		} finally {
			await rm(destDir, { recursive: true, force: true });
		}
	});

	it('produces a location-independent hash that changes with branding content', async () => {
		const firstDir = await mkdtemp(join(tmpdir(), 'wwwallet-branding-a-'));
		const secondDir = await mkdtemp(join(tmpdir(), 'wwwallet-branding-b-'));

		try {
			await Promise.all([
				mkdir(join(firstDir, 'custom')),
				mkdir(join(secondDir, 'custom')),
			]);
			await Promise.all([
				writeFile(join(firstDir, 'logo.svg'), '<svg>same</svg>'),
				writeFile(join(secondDir, 'logo.svg'), '<svg>same</svg>'),
				writeFile(join(firstDir, 'custom', 'theme.json'), '{"brand":"same"}'),
				writeFile(join(secondDir, 'custom', 'theme.json'), '{"brand":"same"}'),
			]);

			const firstHash = getBrandingHash(firstDir);
			expect(getBrandingHash(secondDir)).toBe(firstHash);

			await writeFile(join(secondDir, 'custom', 'theme.json'), '{"brand":"changed"}');
			expect(getBrandingHash(secondDir)).not.toBe(firstHash);
		} finally {
			await Promise.all([
				rm(firstDir, { recursive: true, force: true }),
				rm(secondDir, { recursive: true, force: true }),
			]);
		}
	});

	it('changes the branding hash when an output generation input changes', () => {
		const brandingDir = resolve('branding');
		const firstHash = getBrandingHash(brandingDir, { walletName: 'Wallet A' });
		const secondHash = getBrandingHash(brandingDir, { walletName: 'Wallet B' });

		expect(firstHash).not.toBe(secondHash);
	});
});
