import { readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { copyScreenshots, findLogoFiles, generateAllIcons, getBrandingHash } from './branding';
import { ConfigMap } from './config';
import { htmlMetaTags, metaTag } from './utils/meta-tags';
import robotsTxt from './files/robots';
import wellKnownFiles from './files/well-known';
import sitemapXml from './files/sitemap';
import brandingManifest from './files/manifest';
import themeCSS from './files/theme';
import metadataImage from './files/metadata-image';
import { TagsMap } from './utils/resources';

export type InjectConfigOptions = {
	/**
	 * The directory containing the built assets.
	 *
	 * TODO: figure out if we should use this.
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
	/**
	 * Map of tags to later be injected into the HTML file.
	 * Used to pass tags generated during file injection (e.g. manifest icons) to the HTML injection step.
	 */
	tagsToInject?: TagsMap
}

export async function injectConfigFiles({ bundleDir, destDir, config, tagsToInject }: InjectConfigOptions) {
	if (await readdir(destDir).catch(() => false) === false) {
		throw new Error(`Destination directory ${destDir} does not exist or is not readable.`);
	}

	const brandingHash = process.env.VITE_BRANDING_HASH;

	await Promise.all([
		wellKnownFiles(destDir, config),
		robotsTxt(destDir, config),
		sitemapXml(destDir, config),
		brandingManifest(destDir, config, tagsToInject, brandingHash),
		themeCSS(destDir, tagsToInject, brandingHash),
		metadataImage(destDir, config, tagsToInject, brandingHash),
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
	 * Optional map of additional tags to inject into the HTML.
	 */
	tagsToInject?: TagsMap
	/**
	 * Optional branding hash for cache-busting branding assets.
	 */
	brandingHash?: string;
}

/**
 * Injects meta tags into the built HTML file based on environment variables and branding assets.
 */
export async function injectHtml({ html, config, tagsToInject, brandingHash }: InjectHtmlOptions): Promise<string> {
	const dom = new JSDOM(html);
	const document = dom.window.document;
	const head = document.head;
	if (!head) {
		throw new Error('No <head> element found in HTML.');
	}

	(function injectGeneralMetaTags() {
		if (!tagsToInject) return;

		for (const [key, { tag, props }] of tagsToInject) {
			const element = document.createElement(tag);
			for (const [key, value] of Object.entries(props)) {
				element.setAttribute(key, value);
			}

			const selectors = `${tag}${Object.entries(props).map(([key, value]) => `[${key}="${value}"]`).join('')}`;
			const exitingElement = head.querySelector(selectors);

			if (exitingElement) {
				exitingElement.replaceWith(element);
				continue
			}

			head.appendChild(element);
		}
	})();

	// Inject meta tags
	(function injectConfigMetaTags() {
		const metaTags = htmlMetaTags(config);

		// Add branding logo meta tags
		const { logo_light, logo_dark } = findLogoFiles(resolve('branding'));
		metaTags.push(
			metaTag('branding_logo_light', `/${logo_light.filename}${brandingHash ? `?v=${brandingHash}` : ''}`),
			metaTag('branding_logo_dark', `/${logo_dark.filename}${brandingHash ? `?v=${brandingHash}` : ''}`),
		);

		// Remove existing www: meta tags
		head.querySelectorAll('meta[name^="www:"]').forEach((el) => el.remove());

		for (const { name, content } of metaTags) {
			const meta = document.createElement('meta');
			meta.setAttribute('name', name);
			meta.setAttribute('content', content);
			head.appendChild(meta);
		}
	})();

	// remove extra newlines for cleaner HTML output
	const updatedHtmlContent = dom.serialize().replace(/\n{2,}/g, '\n');

	return updatedHtmlContent;
}
