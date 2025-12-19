/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches, } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
	({ request, url }) => {
		if (request.mode !== "navigate") return false;
		if (url.pathname.startsWith("/_")) return false;
		if (/\.[a-zA-Z]+$/.test(url.pathname)) return false;
		return true;
	},
	createHandlerBoundToURL('/index.html')
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
