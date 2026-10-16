import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fallbackLng, getLanguage } from '@/i18n';

type EmptyItem = Record<string, never>;

interface LocalizedItem {
	locale?: string;
}

export type FilterItemByLang = <T extends LocalizedItem>(
	arrayOfItems: readonly T[] | null | undefined,
) => T | EmptyItem;

const useFilterItemByLang = (): FilterItemByLang => {
	const { i18n } = useTranslation();
	const language = getLanguage(i18n.language);
	const fallbackLanguage = getLanguage(fallbackLng);

	const filterItemByLang = useCallback<FilterItemByLang>((arrayOfItems) => {
		if (!Array.isArray(arrayOfItems) || arrayOfItems.length === 0) {
			return {};
		}

		const getItemLanguage = (item: LocalizedItem) => getLanguage(item.locale);

		const item = arrayOfItems.find(candidate => getItemLanguage(candidate) === language) ||
			arrayOfItems.find(candidate => getItemLanguage(candidate) === fallbackLanguage);

		return item || arrayOfItems[0] || {};
	}, [language, fallbackLanguage]);

	return filterItemByLang;
};

export default useFilterItemByLang;
