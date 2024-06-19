/* eslint-disable no-restricted-globals */

import { clientsClaim } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import {
	saveResponseToIndexedDB,
	getResponseFromIndexedDB,
} from './indexedDB';

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

let currentDid = null;
const BACKEND_URL = process.env.REACT_APP_WALLET_BACKEND_URL;

self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
	if (event.data && event.data.type === 'ADD_APP_TOKEN') {
		const did = parseJwt(event.data.value).did;
		currentDid = did;
		handleSessionStorageChange(event.data.value, did);
	}
});

async function fetchAndSaveResponse(request, did) {
	try {
		const response = await fetch(request);
		if (response.ok) {
			const url = request.url;
			const responseText = await response.clone().text();
			await saveResponseToIndexedDB(did, url, responseText);
			console.log(`Cached response in IndexedDB for URL: ${url}`);
			return response;
		}
	} catch (error) {
		const url = request.url;
		const responseFromIndexedDB = await getResponseFromIndexedDB(did, url);
		if (responseFromIndexedDB) {
			console.log(`Retrieved response from IndexedDB for URL: ${url}`);
			return new Response(responseFromIndexedDB);
		}
		throw error;
	}
}

const matchVCStorageCb = ({ url }) => url.pathname.endsWith("/storage/vc");
const handlerVCStorageCb = async ({ request }) => await fetchAndSaveResponse(request, currentDid);

const matchVCStorageVp = ({ url }) => url.pathname.endsWith("/storage/vp");
const handlerVCStorageVp = async ({ request }) => await fetchAndSaveResponse(request, currentDid);

const matchIssuersCb = ({ url }) => url.pathname.endsWith("/legal_person/issuers/all");
const handlerIssuersCb = async ({ request }) => await fetchAndSaveResponse(request, currentDid);

const matchVerifiersCb = ({ url }) => url.pathname.endsWith("/verifiers/all");
const handlerVerifiersCb = async ({ request }) => await fetchAndSaveResponse(request, currentDid);

const matchAccountInfoCb = ({ url }) => url.pathname.endsWith("/user/session/account-info");
const handlerAccountInfoCb = async ({ request }) => await fetchAndSaveResponse(request, currentDid);

registerRoute(matchVCStorageCb, handlerVCStorageCb);
registerRoute(matchVCStorageVp, handlerVCStorageVp);
registerRoute(matchIssuersCb, handlerIssuersCb);
registerRoute(matchVerifiersCb, handlerVerifiersCb);
registerRoute(matchAccountInfoCb, handlerAccountInfoCb);

async function fetchAndCache(appToken, url, did) {
	const request = new Request(`${BACKEND_URL}${url}`, {
		headers: {
			'Authorization': `Bearer ${appToken}`
		}
	});
	return fetchAndSaveResponse(request, did);
}

async function handleSessionStorageChange(appToken, did) {
	console.log(`Add app token: ${appToken}, DID: ${did}`);

	const urlsToFetch = [
		'/storage/vc',
		'/storage/vp',
		'/legal_person/issuers/all',
		'/verifiers/all',
		'/user/session/account-info'
	];

	for (const url of urlsToFetch) {
		try {
			await fetchAndCache(appToken, url, did);
		} catch (error) {
			console.error(`Error fetching and caching data for ${url}`, error);
		}
	}
}

// Helper function to parse JWT and extract DID
function parseJwt(token) {
	const base64Url = token.split('.')[1];
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	const jsonPayload = decodeURIComponent(
		Array.prototype.map.call(atob(base64), (c) =>
			'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
		).join('')
	);

	return JSON.parse(jsonPayload);
}
