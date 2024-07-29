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

const fileExtensionRegexp = new RegExp("/[^/?]+\\.[^/]+$");
registerRoute(
	({ request, url }) => {
		if (request.mode !== "navigate") {
			return false;
		}
		if (url.pathname.startsWith("/_")) {
			return false;
		}
		if (url.pathname.match(fileExtensionRegexp)) {
			return false;
		}
		return true;
	},
	createHandlerBoundToURL('/index.html')
);

registerRoute(
	({ url }) => url.pathname.endsWith(".png"),
	new StaleWhileRevalidate({
		cacheName: "images",
		plugins: [
			new ExpirationPlugin({ maxEntries: 50 }),
		],
	})
);
