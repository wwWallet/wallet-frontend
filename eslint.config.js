import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const applicationFiles = ['src/**/*.{js,jsx,ts,tsx}'];
const testFiles = ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'];
const nodeFiles = [
	'*.config.{js,ts}',
	'vite.config*.ts',
	'setup-vitest.ts',
	'config/**/*.{js,ts}',
	'vite-plugins/**/*.{js,ts}',
	'translation_coverage/**/*.js',
];

const reactRecommended = react.configs.flat.recommended;
const reactJsxRuntime = react.configs.flat['jsx-runtime'];
const jsxA11yRecommended = jsxA11y.flatConfigs.recommended;
const accessibilityRuleNames = [
	'jsx-a11y/alt-text',
	'jsx-a11y/anchor-has-content',
	'jsx-a11y/anchor-is-valid',
	'jsx-a11y/aria-props',
	'jsx-a11y/aria-proptypes',
	'jsx-a11y/aria-role',
	'jsx-a11y/aria-unsupported-elements',
	'jsx-a11y/iframe-has-title',
	'jsx-a11y/img-redundant-alt',
	'jsx-a11y/role-has-required-aria-props',
	'jsx-a11y/role-supports-aria-props',
];
const accessibilityRules = Object.fromEntries(
	accessibilityRuleNames.map((name) => [name, jsxA11yRecommended.rules[name]]),
);

export default tseslint.config(
	{
		ignores: [
			'coverage/**',
			'dist/**',
			'node_modules/**',
		],
	},
	{
		linterOptions: {
			reportUnusedDisableDirectives: 'error',
		},
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		// Preserve the project's gradual TypeScript posture; type-aware rules can be adopted separately.
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-empty-object-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-namespace': 'off',
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{
					allowShortCircuit: true,
					allowTaggedTemplates: true,
					allowTernary: true,
				},
			],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					args: 'none',
					caughtErrors: 'none',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/no-unsafe-function-type': 'off',
			'no-empty': 'off',
			'no-useless-escape': 'off',
			'no-useless-catch': 'off',
			'no-var': 'off',
			'prefer-const': 'off',
		},
	},
	{
		files: applicationFiles,
		plugins: {
			...reactRecommended.plugins,
			...jsxA11yRecommended.plugins,
			'react-hooks': reactHooks,
		},
		languageOptions: {
			...reactRecommended.languageOptions,
			globals: {
				...globals.browser,
			},
			parserOptions: {
				...reactRecommended.languageOptions?.parserOptions,
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			...reactRecommended.rules,
			...reactJsxRuntime.rules,
			...accessibilityRules,
			'react-hooks/exhaustive-deps': 'warn',
			'react-hooks/rules-of-hooks': 'error',
			'react/display-name': 'off',
			'react/jsx-key': 'off',
			'react/prop-types': 'off',
		},
	},
	{
		files: nodeFiles,
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	{
		files: [
			'src/service-worker.js',
		],
		languageOptions: {
			globals: {
				...globals.serviceworker,
			},
		},
	},
	{
		files: [
			'src/**/*worker.{js,ts}',
			'src/**/worker.{js,ts}',
		],
		languageOptions: {
			globals: {
				...globals.worker,
			},
		},
	},
	{
		...vitest.configs.recommended,
		files: testFiles,
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.vitest,
			},
		},
		rules: {
			...vitest.configs.recommended.rules,
			'vitest/expect-expect': 'off',
		},
	},
	{
		files: [
			'src/utils/qr/**/*.{js,ts}',
		],
		rules: {
			'@typescript-eslint/no-wrapper-object-types': 'off',
			'prefer-const': 'off',
		},
	},
);
