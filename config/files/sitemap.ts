import { resolve } from 'node:path';
import { EnvConfigMap } from '../config';
import { writeFile } from 'node:fs/promises';

/**
 * Generates a sitemap.xml file.
 */
export default async function sitemapXml(destDir: string, config: EnvConfigMap) {
	const content = generateSitemapXml(config.STATIC_PUBLIC_URL);

	const sitemapPath = resolve(destDir, 'sitemap.xml');
	await writeFile(sitemapPath, content, 'utf-8');
}

/**
 * Generates a sitemap.xml file.
 */
function generateSitemapXml(baseUrl: string = 'https://demo.wwwallet.org'): string {
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}/login</loc>
		<lastmod>${today}</lastmod>
		<priority>1.0</priority>
		<changefreq>monthly</changefreq>
	</url>
</urlset>
`;
}
