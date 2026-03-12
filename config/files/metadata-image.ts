import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { MetadataImage } from '../branding';
import { EnvConfigMap } from '../config';
import { TagsMap } from '../utils/resources';

/**
 * Generates a metadata image based on the provided configuration and writes it to the specified destination directory.
 */
export default async function metadataImage(destDir: string, config: EnvConfigMap, tagsToInject?: TagsMap, brandingHash?: string) {
	const fileName = 'image.png';

	const generationConfig = {
		title: config.STATIC_NAME || 'wwWallet',
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
			content: `${config.STATIC_PUBLIC_URL}/image.png?v=${brandingHash}`,
		}
	});
	tagsToInject?.set('twitter-image', {
		tag: 'meta',
		props: {
			name: 'twitter:image',
			content: `${config.STATIC_PUBLIC_URL}/image.png?v=${brandingHash}`,
		}
	});
}
