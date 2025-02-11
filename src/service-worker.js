/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

clientsClaim();

precacheAndRoute([
	...self.__WB_MANIFEST,
	{ url: '/manifest.json', revision: '1' },
	{ url: '/favicon.ico', revision: '1' },
]);

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

self.addEventListener('activate', (event) => {
	event.waitUntil(
		self.clients.claim().then(() => {
			console.log('Service worker activated and claimed all clients.', self.clients.matchAll());

			return self.clients.matchAll().then((clients) => {
				clients.forEach((client) => {
					client.navigate(client.url);
				});
			});
		})
	);
});
