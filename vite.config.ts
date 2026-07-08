import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import type { UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { InjectConfigPlugin } from './vite-plugins';
import { getManifestRevision } from './config/files/manifest';
import { getBrandingHash } from './config/branding';

type LocalViteConfig = Partial<UserConfig>;

const loadLocalViteConfig = async (): Promise<LocalViteConfig> => {
	const localConfigPath = resolve('vite.config.local.ts');

	if (!existsSync(localConfigPath)) {
		return {};
	}

	const localConfigModule = await import(pathToFileURL(localConfigPath).href);
	return (localConfigModule.localViteConfig ?? localConfigModule.default ?? {}) as LocalViteConfig;
};

const mergeViteConfig = (baseConfig: UserConfig, localConfig: LocalViteConfig): UserConfig => {
	const baseServer = baseConfig.server ?? {};
	const localServer = localConfig.server ?? {};
	const baseProxy = typeof baseServer === 'object' ? baseServer.proxy : undefined;
	const localProxy = typeof localServer === 'object' ? localServer.proxy : undefined;

	return {
		...baseConfig,
		...localConfig,
		server: {
			...(typeof baseServer === 'object' ? baseServer : {}),
			...(typeof localServer === 'object' ? localServer : {}),
			proxy: {
				...(baseProxy && typeof baseProxy === 'object' ? baseProxy : {}),
				...(localProxy && typeof localProxy === 'object' ? localProxy : {}),
			},
		},
	};
};

export default defineConfig(async ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const localViteConfig = await loadLocalViteConfig();
	const brandingHash = getBrandingHash(resolve('branding'));
	const manifestRevision = getManifestRevision({
		brandingHash,
		name: env.STATIC_NAME || 'wwWallet',
	});

	mkdirSync(resolve('public'), { recursive: true });

	const baseConfig: UserConfig = {
		base: './',
		define: {
			'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version),
		},
		plugins: [
			InjectConfigPlugin(env),
			react(),
			tailwindcss(),
			svgr(),
			checker({
				eslint: {
					lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
				}
			}),
			VitePWA({
				registerType: 'autoUpdate',
				injectRegister: null,
				srcDir: 'src',
				filename: 'service-worker.js', // Custom service worker (MUST exist in `src/`)
				strategies: 'injectManifest', // Uses `src/service-worker.js` for caching
				manifest: false, // Vite will use `public/manifest.json` automatically
				injectManifest: {
					maximumFileSizeToCacheInBytes: env.GENERATE_SOURCEMAP === 'true' ? 12 * 1024 * 1024 : 4 * 1024 * 1024,
					globIgnores: ['theme.css'],
					additionalManifestEntries: [
						{ url: './manifest.json', revision: manifestRevision },
					],
				},
			}),

		],
		resolve: {
			alias: {
				'@': '/src',
			},
		},
		optimizeDeps: {
			include: ['wallet-common'],
		},
		server: {
			host: true,
			port: 3000,
			open: true,
		},
		preview: {
			host: true,
			port: 3000,
			open: true,
		},
		build: {
			manifest: true,
			sourcemap: env.GENERATE_SOURCEMAP === 'true',
			minify: env.GENERATE_SOURCEMAP !== 'true'
		},
	};

	return mergeViteConfig(baseConfig, localViteConfig);
});
