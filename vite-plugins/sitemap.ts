import fs from 'fs';
import path from 'path';

export function generateSitemapXml(env: Record<string, string>): string {
	const baseUrl = env.VITE_STATIC_PUBLIC_URL || 'https://demo.wwwallet.org';
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${baseUrl}/login</loc>
		<lastmod>${today}</lastmod>
		<priority>1.0</priority>
		<changefreq>monthly</changefreq>
	</url>
</urlset>
`;
}

export function SitemapPlugin(env) {
	return {
		name: 'sitemap-plugin',

		configureServer(server) {
			const sitemapPath = path.resolve("public/sitemap.xml");
			fs.writeFileSync(sitemapPath, generateSitemapXml(env));

			server.watcher.on("change", (file) => {
				if (file.endsWith(".env")) {
					console.log("Environment file changed. Regenerating sitemap.xml...");
					fs.writeFileSync(sitemapPath, generateSitemapXml(env));
				}
			});
		},

		buildStart() {
			const sitemapPath = path.resolve("public/sitemap.xml");
			fs.writeFileSync(sitemapPath, generateSitemapXml(env));
		},
	};
}
