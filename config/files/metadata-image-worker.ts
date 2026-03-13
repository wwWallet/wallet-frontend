import { writeFile } from 'node:fs/promises';
import { MetadataImage } from '../branding.ts';

const args = process.argv.slice(2);

function getFlag(flag: string): string | undefined {
	const index = args.indexOf(flag);
	return index >= 0 ? args[index + 1] : undefined;
}

const dest = getFlag('--dest');
const title = getFlag('--title');

if (!dest) {
	throw new Error('Missing required flag --dest');
}

if (!title) {
	throw new Error('Missing required flag --title');
}

const image = await MetadataImage.generateMetadataImage({ title });
await writeFile(dest, image.source);
