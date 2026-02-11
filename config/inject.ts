import { readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'cheerio';
import { copyScreenshots, findLogoFiles, generateAllIcons, getBrandingHash } from '../branding';
import { ConfigMap } from './utils/config';
import { htmlMetaTags, metaTag } from './utils/meta-tags';
import robotsTxt from './files/robots';
import wellKnownFiles from './files/well-known';
import sitemapXml from './files/sitemap';
import brandingManifest from './files/manifest';
import themeCSS from './files/theme';

export type InjectConfigOptions = {
	/**
	 * The directory containing the built assets.
	 */
	bundleDir?: string;
	/**
	 * The directory to write the configuration-dependant files to.
	 */
	destDir: string;
	/**
	 * The environment variables to use for generating meta tags and other configuration.
	 */
	config: ConfigMap;
}

export async function injectConfigFiles({ bundleDir, destDir, config }: InjectConfigOptions) {
	if (await readdir(destDir).catch(() => false) === false) {
		throw new Error(`Destination directory ${destDir} does not exist or is not readable.`);
	}

	const brandingHash = getBrandingHash(resolve('branding'));

	await Promise.all([
		wellKnownFiles(destDir, config),
		robotsTxt(destDir, config),
		sitemapXml(destDir, config),
		brandingManifest(destDir, config, brandingHash),
		themeCSS(destDir),
	]);
}

export type InjectHtmlOptions = {
	/**
	 * The HTML content to inject meta tags into.
	 */
	html: string;
	/**
	 * The configuration to use for generating meta tags.
	 */
	config: ConfigMap;
	/**
	 * Optional branding hash for cache-busting branding assets.
	 */
	brandingHash?: string;
}

/**
 * Injects meta tags into the built HTML file based on environment variables and branding assets.
 */
export async function injectHtml({ html, config, brandingHash }: InjectHtmlOptions): Promise<string> {
	const $ = load(html);
	const head = $('head');
	if (head.length === 0) {
		throw new Error('No <head> element found in HTML.');
	}

	// Inject meta tags
	(function injectConfigMetaTags() {
		const metaTags = htmlMetaTags(config);

		// // Add branding logo meta tags
		const { logo_light, logo_dark } = findLogoFiles(resolve('branding'));
		metaTags.push(
			metaTag('branding_logo_light', `/${logo_light.filename}${brandingHash ? `?v=${brandingHash}` : ''}`),
			metaTag('branding_logo_dark', `/${logo_dark.filename}${brandingHash ? `?v=${brandingHash}` : ''}`),
		);

		head.find(`meta[name^="www:"]`).remove();

		for (const { name, content } of metaTags) {
			head.append(`<meta name="${name}" content="${content}">\n`);
		}
	})();

	const updatedHtmlContent = $.html({}).replace(/\n{2,}/g, '\n');

	return updatedHtmlContent;
}
