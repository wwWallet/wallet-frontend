import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
		},
	},
	test: {
		globals: true,
		setupFiles: ['./setup-vitest.ts'],
		exclude: ['lib/**', 'node_modules/**'],
		environmentMatchGlobs: [
			['**/services/*.test.ts', 'node'],
			['**', 'jsdom']
		]
	},
});
