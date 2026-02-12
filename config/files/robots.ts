import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ConfigMap } from '../config';

/**
 * Generates a robots.txt file.
 */
export default async function robotsTxt(destDir: string, config: ConfigMap) {
	const content = generateRobotsTxt(config.META_STATIC_PUBLIC_URL);

	const robotsPath = resolve(destDir, 'robots.txt');
	await writeFile(robotsPath, content, 'utf-8');
}

/**
 * Generates a robots.txt file content based on the provided base URL.
 */
export function generateRobotsTxt(baseUrl: string = 'https://demo.wwwallet.org'): string {
	return `
User-agent: *
Disallow: /settings
Disallow: /credential/
Disallow: /history
Disallow: /add
Disallow: /send
Allow: /login

Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`.trim();
}
