// hooks/useFilterItemByLang.js

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguage } from '@/i18n';

const useFilterItemByLang = () => {
	const { i18n } = useTranslation();
	const language = i18n.language;
	const fallbackLang = i18n.options.fallbackLng;

	const filterItemByLang = useCallback((arrayOfItems, langFieldName = 'lang') => {

		if (!Array.isArray(arrayOfItems) || arrayOfItems.length === 0) {
			return {};
		}

		let item = arrayOfItems.find(a => getLanguage(a[langFieldName]) === language) ||
			arrayOfItems.find(a => getLanguage(a[langFieldName]) === fallbackLang);

		return item || arrayOfItems[0] || {};
	}, [language, fallbackLang]);

	return filterItemByLang;
};

export default useFilterItemByLang;
