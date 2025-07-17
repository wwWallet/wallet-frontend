import { getLanguage } from '@/i18n';

interface DisplayEntry {
	lang: string;
	label: string;
	description?: string;
}

interface MergedDisplay {
	lang: string;
	labels: string[];
	descriptions: string[];
}

/**
 * Select display entries in the preferred or fallback language.
 * Always returns a flat array (unmerged).
 */
export const getDisplayArrayByLang = (
	displayArray: DisplayEntry[],
	lang: string,
	fallbackLang?: string
): DisplayEntry[] => {
	const primary = displayArray.filter(
		(d) => getLanguage(d.lang) === lang && !!d.label
	);
	if (primary.length > 0) return primary;

	const fallback = displayArray.filter(
		(d) => getLanguage(d.lang) === fallbackLang && !!d.label
	);
	if (fallback.length > 0) return fallback;

	const first = displayArray.find((d) => !!d.label);
	return first ? [first] : [];
};

/**
 * Merge multiple display entries by language.
 * Deduplicates labels and descriptions.
 */
export const mergeDisplayByLang = (displays: DisplayEntry[]): MergedDisplay[] => {
	const merged: Record<string, { labels: Set<string>; descriptions: Set<string> }> = {};

	for (const { lang, label, description } of displays) {
		if (!merged[lang]) {
			merged[lang] = {
				labels: new Set(),
				descriptions: new Set(),
			};
		}
		merged[lang].labels.add(label);
		if (description) {
			merged[lang].descriptions.add(description);
		}
	}

	return Object.entries(merged).map(([lang, { labels, descriptions }]) => ({
		lang,
		labels: Array.from(labels),
		descriptions: Array.from(descriptions),
	}));
};
