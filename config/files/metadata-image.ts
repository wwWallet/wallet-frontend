import path, { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { MetadataImage } from '../branding';
import { EnvConfigMap } from '../config';
import { TagsMap } from '../utils/resources';

const execFileAsync = promisify(execFile);
const METADATA_IMAGE_TIMEOUT_MS = 3000;

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

	const filePath = path.join(destDir, fileName);
	const tsxPath = join(dirname(process.execPath), 'tsx');

	try {
		await execFileAsync(
			tsxPath,
			[
				path.resolve('config', 'files', 'metadata-image-worker.ts'),
				'--dest',
				filePath,
				'--title',
				generationConfig.title,
			],
			{
				cwd: process.cwd(),
				timeout: METADATA_IMAGE_TIMEOUT_MS,
			},
		);
	} catch (error) {
		console.warn('Metadata image generation failed, using fallback image.', error);
		const image = await MetadataImage.generateMetadataImageFallback();
		await writeFile(filePath, image.source);
	}

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
