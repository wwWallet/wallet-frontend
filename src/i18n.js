// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en.json';
import elTranslation from './locales/el.json';

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: enTranslation },
			el: { translation: elTranslation },
		},
		fallbackLng: 'en',
		lng: localStorage.getItem('locale') || navigator.language,
		interpolation: {
			escapeValue: false,
		},
	});

export default i18n;
