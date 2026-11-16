import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const nodeTests = '**/services/*.test.ts';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(import.meta.dirname, './src'),
		},
	},
	test: {
		globals: true,
		setupFiles: ['./setup-vitest.ts'],
		exclude: ['lib/**', 'node_modules/**'],
		projects: [
			{
				extends: true,
				test: {
					name: 'node',
					include: [nodeTests],
					environment: 'node',
				},
			},
			{
				extends: true,
				test: {
					name: 'jsdom',
					exclude: [nodeTests],
					environment: 'jsdom',
				},
			},
		],
		typecheck: {
			enabled: true,
		},
	},
});
