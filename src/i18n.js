// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as config from './config';

import enTranslation from './locales/en.json';
import elTranslation from './locales/el.json';

const fallbackLng = 'en';

const resources = {
	en: { translation: enTranslation },
	el: { translation: elTranslation },
};

// Check if multi-language display is enabled
const isMultiLanguageEnabled = config.REACT_APP_MULTI_LANGUAGE_DISPLAY;

// Only keep the fallback language if multi-language is disabled
const availableResources = isMultiLanguageEnabled ? resources : { [fallbackLng]: resources[fallbackLng] };

// Helper function to get only the language part and check if it exists
const getLanguage = (locale) => {
	const language = locale.includes('-') ? locale.split('-')[0] : locale;
	return language;
};

// Get the preferred language
let preferredLanguage =
	localStorage.getItem('locale') || // Check localStorage first
	getLanguage(navigator.language) || // Check navigator.language next
	getLanguage(navigator.languages ? navigator.languages[0] : null) || // Check navigator.languages[0] last
	null;

// Ensure preferred language exists in available resources
if (!availableResources[preferredLanguage]) {
	preferredLanguage = fallbackLng;
}

// If multi-language is disabled, force the fallback language
const languageSetting = isMultiLanguageEnabled ? preferredLanguage : fallbackLng;

i18n
	.use(initReactI18next)
	.init({
		resources: availableResources,
		fallbackLng,
		lng: languageSetting,
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
