import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";

type Env = Record<string, string|null|undefined>;

const DIR = resolve("public/.well-known");

async function generateAndroidAppLinks(env: Env) {
	const packages = env.VITE_WELLKNOWN_ANDROID_PACKAGE_NAMES_AND_FINGERPRINTS;
	if (typeof packages !== "string") return;

	const pkgsList = packages
		.split(",")
		.map(item => {
			const [pkgName, fingerprints] = item.split("::").map(str => str.trim());

			return pkgName && fingerprints ? { pkgName, fingerprints } : null;
		})
		.filter(pkg => pkg !== null);

	if (pkgsList.length < 1) return;

	const tmpl = pkgsList.map(({ pkgName, fingerprints}) => ({
		"relation": [
			"delegate_permission/common.handle_all_urls",
			"delegate_permission/common.get_login_creds"
		],
		"target": {
			"namespace": "android_app",
			"package_name": pkgName,
			"sha256_cert_fingerprints": [fingerprints]
		}
	}));

	const filePath = resolve(DIR, "assetlinks.json");

	await writeFile(filePath, JSON.stringify(tmpl, null, 2));
}


async function generateAppleAppLinks(env: Env) {
	const apps = env.VITE_WELLKNOWN_APPLE_APPIDS;
	if (typeof apps !== "string") return;

	const appsList = apps
		.split(",")
		.map(app => app.trim())
		.filter(app => app.length > 0);

	if (appsList.length < 1) return;

	const tmpl = {
		"applinks": {
			"details": [
				{
					"appIDs": appsList,
					"components": [
						{
							"/": "/*",
							"comment": "Matches any URL with a path that starts with /."
						}
					]
				}
			]
		},
		"webcredentials": {
				"apps": appsList
		}
	};

	const filePath = resolve(DIR, "apple-app-site-association");

	await writeFile(filePath, JSON.stringify(tmpl, null, 2));
}

async function writeAppLinksFiles(env: Env) {
	await mkdir(DIR, { recursive: true }),
	await Promise.all([
		generateAndroidAppLinks(env),
		generateAppleAppLinks(env),
	]);
}

export function MobileWrapperWKAppLinksPlugin(env: Env) {
	return {
		name: "mobile-wrapper-applinks-plugin",

		async configureServer(server) {
			await writeAppLinksFiles(env);

			server.watcher.on("change", async (file) => {
				if (file.endsWith(".env")) {
					console.log("Environment file changed. Regenerating .well-kown applinks files...");
					await writeAppLinksFiles(env);
				}
			});
		},

		async buildStart() {
			await writeAppLinksFiles(env);
		},
	};
}
