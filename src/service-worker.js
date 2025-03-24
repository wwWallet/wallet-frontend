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

self.addEventListener('fetch', event => {
	if (event.request.method === 'POST' && event.request.url.includes('/proxy')) {
		console.log('Handling POST request:', event.request.url);
		event.respondWith(handlePostRequest(event.request));
	}
});

async function handlePostRequest(request) {
	try {
		const bodyJson = await getRequestBody(request);
		if (bodyJson.url && /\.(png|jpg|jpeg|svg|webp)$/i.test(bodyJson.url)) {
			return await cachePostResponse(request, bodyJson.url);
		}
		return await fetch(request);
	} catch (error) {
		return handleOffline(request);
	}
}

async function getRequestBody(request) {
	const clonedRequest = request.clone();
	const bodyText = await clonedRequest.text();
	try {
		return JSON.parse(bodyText);
	} catch (error) {
		throw new Error('Failed to parse request body');
	}
}

async function cachePostResponse(request, cacheKey) {
	try {
		const response = await fetch(request.clone());
		if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

		const cache = await caches.open('proxy-images');
		await cache.put(new Request(cacheKey, { method: 'GET' }), response.clone());
		return response;
	} catch (error) {
		throw error;
	}
}

async function handleOffline(request) {
	try {
		const bodyJson = await getRequestBody(request);
		const cache = await caches.open('proxy-images');
		const cachedResponse = await cache.match(new Request(bodyJson.url, { method: 'GET' }));
		if (cachedResponse) {
			return cachedResponse;
		}
		throw new Error('No cached response available');
	} catch (error) {
		console.error('Error in handleOffline:', error);
		return new Response('Cache retrieval failed', { status: 500 });
	}
}
