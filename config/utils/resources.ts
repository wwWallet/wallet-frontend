import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export type FileToWrite<T = any> = {
	/**
	 * The filename to write the content to.
	 */
	filename: string;
	/**
	 * The finished data.
	 */
	data?: T extends object ? T : never;
	/**
	 * The content to write to the file as a string.
	 */
	content: string;
}

export type Tag = {
	tag: 'meta' | 'link' | 'title';
	props?: Record<string, string>;
	textContent?: string;
}

export type TagsMap = Map<string, Tag>;

type ViteManifest = Record<string, {
	file: string;
	src?: string;
	isEntry?: boolean;
	css?: string[];
	assets?: string[];
} | undefined>;

/**
 * Reads and parses the Vite manifest file to retrieve information about the generated assets.
 */
export async function readViteManifest(basePath: string): Promise<ViteManifest> {
	const manifestContent = await readFile(resolve(basePath, '.vite', 'manifest.json'), 'utf-8');

	return JSON.parse(manifestContent) as ViteManifest;
}


export type TransformKeysToLowercase<T> = {
	[K in keyof T as Lowercase<K & string>]: T[K]
};
