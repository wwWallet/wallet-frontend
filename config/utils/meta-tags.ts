export type HTMLMetaTags = Array<{
	name: string;
	content: string;
}>

/**
 * Generates an array of meta tag objects based on specific environment variables.
 */
export function htmlMetaTags(config: Record<string, string>): HTMLMetaTags {
	const tags: HTMLMetaTags = [];

	for (const [key, value] of Object.entries(config)) {
		// Only include environment variables that start with "META_" as meta tags.
		if (!key.startsWith('META_')) continue;

		tags.push(metaTag(key, value ?? ''));
	}

	return tags;
}

/**
 * Create a meta tag object with a standardized name format.
 * The name is prefixed with "www:" and converted to lowercase, with any "vite_" prefix removed.
 */
export function metaTag(name: string, content: string) {
	name = name.toLocaleLowerCase()
		.replace(/^vite_/, '')
		.replace(/^meta_/, '');

	return {
		name: `www:${name}`,
		content,
	};
}
