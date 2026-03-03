import { readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { copyScreenshots, findLogoFiles, generateAllIcons, getBrandingHash } from './branding';
import { ClientMetaConfigSchema, EnvConfigMap, getMetaConfigFromEnvConfig } from './config';
import robotsTxt from './files/robots';
import wellKnownFiles from './files/well-known';
import sitemapXml from './files/sitemap';
import brandingManifest from './files/manifest';
import themeCSS from './files/theme';
import metadataImage from './files/metadata-image';
import { Tag, TagsMap } from './utils/resources';
import { configMetaTag, getTagSortingPriority, insertTag } from './utils/tags';
import { pathWithBase } from './utils/paths';

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
	config: EnvConfigMap;
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

	const brandingHash = process.env.BRANDING_HASH;

	await Promise.all([
		wellKnownFiles(destDir, config),
		robotsTxt(destDir, config),
		sitemapXml(destDir, config),
		brandingManifest(destDir, config, tagsToInject, brandingHash),
		themeCSS(destDir, config, tagsToInject, brandingHash),
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
	config: EnvConfigMap;
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

	(function injectSocialMetaTags() {
		const tags: Tag[] = [
			{ tag: 'title', textContent: config.STATIC_NAME, props: {} },
			{ tag: 'meta', props: { name: 'description', content: `${config.STATIC_NAME} is a secure web wallet for storing and managing verifiable credentials.` } },
			{ tag: 'meta', props: { name: 'keywords', content: 'wwWallet, web wallet, wallet, secure storage, verifiable credentials, digital credentials, credentials management' } },
			{ tag: 'meta', props: { property: 'og:title', content: `${config.STATIC_NAME}: Secure Storage and Management of Verifiable Credentials` } },
			{ tag: 'meta', props: { property: 'og:description', content: `${config.STATIC_NAME} is a secure web wallet for storing and managing verifiable credentials.` } },
			{ tag: 'meta', props: { property: 'og:url', content: config.STATIC_PUBLIC_URL || '' } },
			{ tag: 'meta', props: { property: 'og:type', content: 'website' } },
			{ tag: 'meta', props: { name: 'twitter:title', content: `${config.STATIC_NAME}: Secure Storage and Management of Verifiable Credentials` } },
			{ tag: 'meta', props: { name: 'twitter:description', content: `${config.STATIC_NAME} is a secure web wallet for storing and managing verifiable credentials.` } },
			{ tag: 'meta', props: { name: 'twitter:card', content: 'summary_large_image' } },
		];

		for (const tag of tags) {
			insertTag(document, head, tag);
		}
	})();

	(function injectGeneralMetaTags() {
		if (!tagsToInject) return;

		for (const [_, tagDef] of tagsToInject) {
			insertTag(document, head, tagDef);
		}
	})();

	// Inject meta tags
	(function injectConfigMetaTags() {
		const metaConfig = getMetaConfigFromEnvConfig(config);

		// Add branding logo meta tags
		const { logo_light, logo_dark } = findLogoFiles(resolve('branding'));

		metaConfig.branding = {
			logo_light: pathWithBase(config.BASE_PATH, `${logo_light.filename}${brandingHash ? `?v=${brandingHash}` : ''}`),
			logo_dark: pathWithBase(config.BASE_PATH, `${logo_dark.filename}${brandingHash ? `?v=${brandingHash}` : ''}`),
		};

		insertTag(document, head, configMetaTag(metaConfig));
	})();

	(function sortHead() {
		const children = Array.from(head.children);

		children.sort((a, b) => {
			const priorityDiff = getTagSortingPriority(a) - getTagSortingPriority(b);
			if (priorityDiff !== 0) return priorityDiff;

			// Secondary sort: alphabetically by relevant attribute
			const aAttr = a.getAttribute('href') || a.getAttribute('src') || a.getAttribute('name') || '';
			const bAttr = b.getAttribute('href') || b.getAttribute('src') || b.getAttribute('name') || '';
			return aAttr.localeCompare(bAttr);
		});

		while (head.firstChild) {
			head.removeChild(head.firstChild);
		}

		for (const child of children) {
			for (const attr of ['href', 'src'] as const) {
				const value = child.getAttribute(attr);
				if (value && config.BASE_PATH && !value.startsWith(config.BASE_PATH)) {
					child.setAttribute(attr, pathWithBase(config.BASE_PATH, value));
				}
			}

			head.appendChild(child);
		}
	})();

	// remove possible extra newlines for cleaner HTML output
	const updatedHtmlContent = dom.serialize().replace(/\n{2,}/g, '\n');

	return updatedHtmlContent;
}
