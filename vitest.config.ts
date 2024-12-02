import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		setupFiles: ['./setup-vitest.ts'],
		environmentMatchGlobs: [
			['**/services/*.test.ts', 'node'],
			['**', 'jsdom']
		]
	},
})
