import { Suspense } from 'react';
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';

// Brand CSS custom properties (--theme-brand-color*) consumed by src/index.css
import './brand-theme.css';
// Tailwind v4 + all app theme tokens, keyframes and base styles
import '../src/index.css';
// Fonts used across the app
import '@fontsource/inter';

// Initialise i18next so components using `useTranslation` render real copy.
import '../src/i18n';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		options: {
			storySort: {
				order: ['Introduction', 'Components'],
			},
		},
		// The `.dark` toggle drives html/body background via src/index.css,
		// so we don't need Storybook's own backgrounds addon fighting it.
		backgrounds: { disable: true },
	},

	decorators: [
		// Adds/removes `dark` on <html>, matching how the app toggles color scheme.
		withThemeByClassName({
			themes: {
				light: '',
				dark: 'dark',
			},
			defaultTheme: 'light',
		}),
		(Story) => (
			<Suspense fallback={<div className="p-4">Loading…</div>}>
				<div className="p-6 text-lm-gray-900 dark:text-white">
					<Story />
				</div>
			</Suspense>
		),
	],
};

export default preview;
