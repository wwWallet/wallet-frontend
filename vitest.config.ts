import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		setupFiles: ['./setup-vitest.ts'],
		exclude: ['lib/**', 'node_modules/**']
	},
})
