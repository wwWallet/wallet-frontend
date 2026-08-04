/* eslint-disable no-restricted-globals */
/* global importScripts */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from "workbox-strategies";

// Build/injection regenerates this file; byte changes trigger a service worker update.
const runtimePrecachePolicy = self.trustedTypes?.createPolicy("sw-register", {
	createScriptURL: (url) => url,
});
importScripts(
	runtimePrecachePolicy?.createScriptURL("./runtime-precache.js")
	?? "./runtime-precache.js"
);

const basePath = new URL(self.registration.scope).pathname.replace(/\/?$/, '/') || '/';
const appShellCacheName = `app-shell:${basePath}`;
const appShellBypassPaths = import.meta.env.VITE_APP_SHELL_BYPASS_PATHS;
const runtimePrecacheManifest = self.__RUNTIME_PRECACHE_MANIFEST || [];

clientsClaim();
cleanupOutdatedCaches();

precacheAndRoute([
	...self.__WB_MANIFEST,
	...runtimePrecacheManifest,
]);

const SPA_ROUTE_ALLOWLIST = [
	/^\/$/,                              // Home
	/^\/settings$/,                      // Settings
	/^\/history$/,                       // History list
	/^\/pending$/,                       // Pending
	/^\/add$/,                           // Add credentials
	/^\/send$/,                          // Send credentials
	/^\/verification\/result$/,          // Verification result
	/^\/login$/,                         // Login
	/^\/register$/,                      // Register
	/^\/login-state$/,                   // Login state
	/^\/cb(\/.*)?$/,                     // Callback routes
	/^\/credential\/[^/]+$/,             // Credential
	/^\/credential\/[^/]+\/history$/,    // Credential history
	/^\/credential\/[^/]+\/details$/,    // Credential details
	/^\/history\/[^/]+$/,                // History detail
];

const appShellStrategy = new NetworkFirst({
	cacheName: appShellCacheName,
	networkTimeoutSeconds: 3,
});

const matchesPathPrefix = (pathname, pathPrefix) =>
	pathPrefix === "/" ||
	pathname === pathPrefix ||
	pathname.startsWith(`${pathPrefix}/`);

registerRoute(
	({ request, url }) => {
		if (request.mode !== "navigate") return false;

		const scopeRelativePathname = url.pathname.slice(basePath.length - 1);
		const bypassesAppShell = appShellBypassPaths.some((pathPrefix) =>
			matchesPathPrefix(scopeRelativePathname, pathPrefix)
		);
		if (bypassesAppShell) return false;

		if (url.pathname.startsWith("/_")) return false;
		if (/\.[a-zA-Z0-9]+$/.test(url.pathname)) return false;

		const pathname = url.pathname.replace(/^(\/id\/([a-z0-9-]+))/, '');

		return SPA_ROUTE_ALLOWLIST.some((re) => re.test(pathname));
	},
	async ({ event }) => {
		const appShellUrl = new URL(`${basePath}index.html`, self.location.origin);
		const appShellRequest = new Request(appShellUrl, {
			credentials: "same-origin",
			cache: "reload",
		});

		return appShellStrategy.handle({
			event,
			request: appShellRequest,
		});
	}
);

registerRoute(
	({ request, url }) =>
		request.destination === "style" &&
		url.pathname.endsWith("theme.css"),
	new StaleWhileRevalidate({
		cacheName: "theme",
		plugins: [
			new ExpirationPlugin({
				maxEntries: 5,
			}),
		],
	})
);

registerRoute(
	({ url }) =>
		url.pathname.endsWith(".ico") ||
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

registerRoute(
	({ request }) => request.destination === "font",
	new CacheFirst({
		cacheName: "fonts",
		plugins: [
			new ExpirationPlugin({
				maxEntries: 50,
			}),
		],
	})
);

let isFirstVisit = false;

self.addEventListener('install', (event) => {
	isFirstVisit = !self.registration.active;
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			// Delete the old unscoped app shell cache.
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => name === "app-shell")
					.map((name) => caches.delete(name))
			);

			// Claim and reload clients
			await self.clients.claim();

			if (!isFirstVisit) {
				const clients = await self.clients.matchAll();
				clients.forEach((client) => {
					client.navigate(client.url);
				});
			}
		})()
	);
});
