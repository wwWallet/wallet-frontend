// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as config from './config';
import { jsonParseTaggedBinary } from './util';

import enTranslation from './locales/en.json';
import elTranslation from './locales/el.json';
import ptTranslation from './locales/pt.json';

const fallbackLng = 'en';

let storedLocale = null;
const raw = localStorage.getItem('appSettings');
const parsed = raw ? jsonParseTaggedBinary(raw) : null;
storedLocale = parsed?.locale ?? null;

console.log('storedLocale',storedLocale)
const resources = {
	en: { translation: enTranslation },
	el: { translation: elTranslation },
	pt: { translation: ptTranslation },
};

if (config.I18N_WALLET_NAME_OVERRIDE) {
	for (const lang in resources) {
		resources[lang].translation.common.walletName = config.I18N_WALLET_NAME_OVERRIDE;
	}
}

// Check if multi-language display is enabled
const isMultiLanguageEnabled = config.MULTI_LANGUAGE_DISPLAY;

// Only keep the fallback language if multi-language is disabled
const availableResources = isMultiLanguageEnabled ? resources : { [fallbackLng]: resources[fallbackLng] };

// Helper function to get only the language part and check if it exists
export const getLanguage = (locale) => {
	const language = locale.includes('-') ? locale.split('-')[0] : locale;
	return language;
};

// Get the preferred language
let preferredLanguage =
	storedLocale || // Check localStorage first
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
