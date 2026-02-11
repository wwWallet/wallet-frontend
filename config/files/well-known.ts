import { resolve } from 'node:path';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { type FileToWrite } from '../utils/resources';
import { type ConfigMap } from '../utils/config';


/**
 * Generates .well-known files.
 */
export default async function wellKnownFiles(destDir: string, config: ConfigMap) {
	// Remove existing .well-known directory in dist if it exists to ensure old files are cleared out
	await rm(resolve(destDir, '.well-known'), { recursive: true }).catch(() => null);

	const assetLinks = generateAndroidAssetLinks(config.WELLKNOWN_ANDROID_PACKAGE_NAMES_AND_FINGERPRINTS);
	const appLinks = generateAppleAppLinks(config.WELLKNOWN_APPLE_APPIDS);

	const filesToWrite = [assetLinks, appLinks]
		.filter((file) => file !== undefined);

	if (!filesToWrite || filesToWrite.length < 1) {
		console.info('No .well-known files to write.');
		return;
	}

	await writeWellKnownFiles(destDir, filesToWrite);
}

type AndroidAssetLinks = Array<{
	relation: string[];
	target: {
		namespace: string;
		package_name: string;
		sha256_cert_fingerprints: string[];
	};
}>

/**
 * Generates the assetlinks.json file for Android App Links based on the provided packages string.
 * The packages string should be in the format: 'com.example.app1::FINGERPRINT1,com.example.app2::FINGERPRINT2'
 * Each entry consists of the package name and its corresponding SHA256 certificate fingerprint, separated by '::'.
 * The generated assetlinks.json file will be saved in the specified directory.
 *
 * @param {string} packages - A comma-separated string of package names and their fingerprints.
 */
function generateAndroidAssetLinks(packages: unknown): FileToWrite<AndroidAssetLinks> | undefined {
	if (typeof packages !== 'string') return;

	const pkgsList = packages
		.split(',')
		.map(item => {
			const [pkgName, fingerprints] = item.split('::').map(str => str.trim());

			return pkgName && fingerprints ? { pkgName, fingerprints } : null;
		})
		.filter(pkg => pkg !== null);

	if (pkgsList.length < 1) return;

	const tmpl = pkgsList.map(({ pkgName, fingerprints}) => ({
		'relation': [
			'delegate_permission/common.handle_all_urls',
			'delegate_permission/common.get_login_creds'
		],
		'target': {
			'namespace': 'android_app',
			'package_name': pkgName,
			'sha256_cert_fingerprints': [fingerprints]
		}
	})) satisfies AndroidAssetLinks;

	return {
		filename: 'assetlinks.json',
		data: tmpl,
		content: JSON.stringify(tmpl, null, 2),
	};
}

export type AppleAppLinks = {
	applinks: {
		details: Array<{
			appIDs: string[];
			components: Array<{
				'/': string;
				comment: string;
			}>;
		}>;
	};
	webcredentials: {
		apps: string[];
	};
}

/**
 * Generates the apple-app-site-association file for Apple App Links based on the provided apps string.
 * The apps string should be a comma-separated list of app IDs (e.g., 'ABCDE12345.com.example.app1,ABCDE12345.com.example.app2').
 * The generated apple-app-site-association file will contain the necessary details for both applinks and webcredentials.
 *
 * @param apps - A comma-separated string of app IDs.
 */
function generateAppleAppLinks(apps: unknown): FileToWrite<AppleAppLinks> | undefined {
	if (typeof apps !== 'string') return;

	const appsList = apps
		.split(',')
		.map(app => app.trim())
		.filter(app => app.length > 0);

	if (appsList.length < 1) return;

	const tmpl = {
		'applinks': {
			'details': [
				{
					'appIDs': appsList,
					'components': [
						{
							'/': '/*',
							'comment': 'Matches any URL with a path that starts with /.'
						}
					]
				}
			]
		},
		'webcredentials': {
				'apps': appsList
		}
	} satisfies AppleAppLinks;

	return {
		filename: 'apple-app-site-association',
		data: tmpl,
		content: JSON.stringify(tmpl, null, 2),
	};
}

/**
 * Writes the provided files to the .well-known directory within the specified root directory.
 * Each file is defined by its filename and content.
 *
 * @param rootDir The root directory where the .well-known directory will be created.
 * @param files An array of files to write, each defined by its filename and content.
 * @returns A promise that resolves when all files have been written.
 */
async function writeWellKnownFiles(rootDir: string, files: FileToWrite[]) {
	const wellKnownDir = resolve(rootDir, '.well-known');

	if (await access(wellKnownDir).then(() => true).catch(() => false)) {
		console.info('.well-known directory already exists');
	}

	if (files.length < 1) {
		console.info('No .well-known files to write.');
		return;
	};

	await mkdir(wellKnownDir, { recursive: true });
	await Promise.all(files.map(async ({ filename, content }) => {
		const filePath = resolve(wellKnownDir, filename);
		await writeFile(filePath, content);
	}));
}

