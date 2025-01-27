// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import elTranslation from './locales/el.json';

// Helper function to get only the language part and check if it exists
const getLanguage = (locale) => {
	const language = locale.includes('-') ? locale.split('-')[0] : locale;
	return language;
};

// Get the preferred language
const preferredLanguage =
	localStorage.getItem('locale') || // Check localStorage first
	getLanguage(navigator.language) || // Check navigator.language next
	getLanguage(navigator.languages ? navigator.languages[0] : null) || // Check navigator.languages[0] last
	null;

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: enTranslation },
			el: { translation: elTranslation },
		},
		fallbackLng: 'en',
		lng: preferredLanguage,
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
