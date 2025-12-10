import fs from 'fs';
import path from 'path';
import { Plugin } from 'vite';
import { Env } from './resources/types';

export function generateRobotsTxt(env: Env): string {
	const baseUrl = env.VITE_STATIC_PUBLIC_URL || 'https://demo.wwwallet.org';
	return `
User-agent: *
Disallow: /settings
Disallow: /credential/
Disallow: /history
Disallow: /add
Disallow: /send
Allow: /login

Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`.trim();
}

export function RobotsTxtPlugin(env: Env): Plugin {
	return {
		name: 'robots-txt-plugin',

		configureServer(server) {
			const robotsPath = path.resolve("public/robots.txt");
			fs.writeFileSync(robotsPath, generateRobotsTxt(env));

			server.watcher.on("change", (file) => {
				if (file.endsWith(".env")) {
					console.log("Environment file changed. Regenerating robots.txt...");
					fs.writeFileSync(robotsPath, generateRobotsTxt(env));
				}
			});
		},

		buildStart() {
			const robotsPath = path.resolve("public/robots.txt");
			fs.writeFileSync(robotsPath, generateRobotsTxt(env));
		},
	};
}
