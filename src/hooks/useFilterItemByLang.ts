import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguage } from '@/i18n';

type EmptyItem = Record<string, never>;

export type FilterItemByLang = <T extends object>(
	arrayOfItems: readonly T[] | null | undefined,
	langFieldName?: string,
) => T | EmptyItem;

const useFilterItemByLang = (): FilterItemByLang => {
	const { i18n } = useTranslation();
	const language = i18n.language;
	const fallbackLang = i18n.options.fallbackLng;

	const filterItemByLang = useCallback<FilterItemByLang>((arrayOfItems, langFieldName = 'lang') => {
		if (!Array.isArray(arrayOfItems) || arrayOfItems.length === 0) {
			return {};
		}

		const getItemLanguage = (item: object) => {
			const value = (item as Record<string, unknown>)[langFieldName];
			return getLanguage(typeof value === 'string' ? value : undefined);
		};

		const item = arrayOfItems.find(candidate => getItemLanguage(candidate) === language) ||
			arrayOfItems.find(candidate => getItemLanguage(candidate) === fallbackLang);

		return item || arrayOfItems[0] || {};
	}, [language, fallbackLang]);

	return filterItemByLang;
};

export default useFilterItemByLang;
