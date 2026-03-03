/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, cleanupOutdatedCaches, } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

const basePath = new URL(self.registration.scope).pathname.replace(/\/?$/, '/') || '/';

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

const SPA_ROUTE_ALLOWLIST = [
	/^\/$/,                              // Home
	/^\/settings$/,                      // Settings
	/^\/history$/,                       // History list
	/^\/pending$/,                       // Pending
	/^\/add$/,                           // Add credentials
	/^\/send$/,                          // Send credentials
	/^\/verification\/result$/,          // Verification result
	/^\/login$/,                         // Login
	/^\/login-state$/,                   // Login state
	/^\/cb(\/.*)?$/,                     // Callback routes
	/^\/credential\/[^/]+$/,             // Credential
	/^\/credential\/[^/]+\/history$/,    // Credential history
	/^\/credential\/[^/]+\/details$/,    // Credential details
	/^\/history\/[^/]+$/,                // History detail
];

registerRoute(
	({ request, url }) => {
		if (request.mode !== "navigate") return false;
		if (url.pathname.startsWith("/_")) return false;
		if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) return false;

		const pathname = url.pathname.replace(/^(\/id\/([a-z0-9-]+))/, '');

		return SPA_ROUTE_ALLOWLIST.some((re) => re.test(pathname));
	},
	async () => {
		const indexPath = `${basePath}index.html`;
		const cached = await caches.match(indexPath);

		return cached || await fetch(indexPath);
	}
);

registerRoute(
	({ url }) =>
		url.pathname.endsWith(".png") ||
		url.pathname.endsWith(".jpg") ||
		url.pathname.endsWith(".jpeg") ||
		url.pathname.endsWith(".svg") ||
		url.pathname.endsWith(".webp"),
	new StaleWhileRevalidate({
		cacheName: "images",
		plugins: [
			new ExpirationPlugin({
				maxEntries: 200,
			}),
		],
	})
);

self.addEventListener('install', (event) => {
	self.skipWaiting();
});


self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			// Clean old Workbox precache caches
			await cleanupOutdatedCaches();

			// Delete runtime image cache
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => name === "images")
					.map((name) => caches.delete(name))
			);

			// Claim and reload clients
			await self.clients.claim();
			const clients = await self.clients.matchAll();
			clients.forEach((client) => {
				client.navigate(client.url);
			});
		})()
	);
});
