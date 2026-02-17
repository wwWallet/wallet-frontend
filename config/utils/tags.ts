export function getTagSortingPriority(el: Element): number {
	const tag = el.tagName.toLowerCase();
	const rel = el.getAttribute('rel') || '';
	const name = el.getAttribute('name') || '';
	const property = el.getAttribute('property') || '';
	const href = el.getAttribute('href') || '';

	// charset
	if (tag === 'meta' && el.hasAttribute('charset')) return 1;

	// viewport
	if (tag === 'meta' && name === 'viewport') return 2;

	// title
	if (tag === 'title') return 3;

	// favicons & theming
	if (
		(tag === 'link' && /icon/i.test(rel)) ||
		(tag === 'link' && rel === 'manifest') ||
		(tag === 'meta' && name === 'theme-color') ||
		(tag == 'link' && /theme.css/i.test(href))
	) return 4;

	// description, keywords, og:*, twitter:*
	if (tag === 'meta') {
		if (name === 'description' || name === 'keywords') return 5;
		if (name.startsWith('og:') || name.startsWith('twitter:') || property.startsWith('og:')) return 5;
	}

	// assets
	if (
		(tag === 'link' && rel === 'stylesheet') ||
		tag === 'style' ||
		tag === 'script'
	) return 6;

	// meta tags with name starting with www:*
	if (tag === 'meta' && name.startsWith('www:')) return 7;

	return 8;
}
