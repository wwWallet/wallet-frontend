import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@storybook/addon-essentials',
		'@storybook/addon-themes',
	],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	// builder-vite auto-loads the app's vite.config.ts (giving us React, Tailwind, svgr
	// and the `@` -> `/src` alias for free), but it also drags in plugins that are wrong
	// or wasteful inside Storybook: the PWA plugin (registers a service worker), the
	// config-injection plugin, and the whole-repo eslint/tsc checker. Flatten the plugin
	// tree (some plugins are nested arrays) and strip those out.
	viteFinal: async (viteConfig) => {
		const appOnly = (name?: string) =>
			!!name &&
			(name.includes('pwa') || name === 'vite-plugin-checker' || name === 'inject-config');

		const flatten = (plugins: unknown[]): any[] =>
			plugins.flatMap((p) => (Array.isArray(p) ? flatten(p) : [p]));

		const plugins = flatten(viteConfig.plugins ?? []).filter(
			(p) => !(p && typeof p === 'object' && appOnly(p.name)),
		);

		return { ...viteConfig, plugins };
	},
};

export default config;
