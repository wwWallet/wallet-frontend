import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { MetadataImage } from '../branding';
import { ConfigMap } from '../config';
import { TagsMap } from '../utils/resources';

/**
 * Generates a metadata image based on the provided configuration and writes it to the specified destination directory.
 */
export default async function metadataImage(destDir: string, config: ConfigMap, tagsToInject?: TagsMap, brandingHash?: string) {
	const fileName = 'image.png';

	const generationConfig = {
		title: config.META_STATIC_NAME || 'wwWallet',
	};

	const cacheDir = path.resolve('config', '.cache');

	if (!(await MetadataImage.hasFontsEnvironment(cacheDir))) {
		await MetadataImage.setupFontsEnvironment(cacheDir);
	}

	const image = await MetadataImage.generateMetadataImage(generationConfig);

	await writeFile(path.join(destDir, fileName), image.source);

	tagsToInject?.set('og-image', {
		tag: 'meta',
		props: {
			property: 'og:image',
			content: `${config.META_STATIC_PUBLIC_URL}/image.png?v=${brandingHash}`,
		}
	});
	tagsToInject?.set('twitter-image', {
		tag: 'meta',
		props: {
			name: 'twitter:image',
			content: `${config.META_STATIC_PUBLIC_URL}/image.png?v=${brandingHash}`,
		}
	});
}
