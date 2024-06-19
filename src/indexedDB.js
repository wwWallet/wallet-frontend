import { openDB } from 'idb';

const DB_NAME = "wwwallet-db";
const DB_VERSION = 1;
const DB_STORAGE_VC_NAME = "storage";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
	upgrade(db) {
		db.createObjectStore(DB_STORAGE_VC_NAME);
	},
});

export async function saveResponseToIndexedDB(did, url, responseText) {
	const db = await dbPromise;
	const key = `${did}-${url}`;
	await db.put(DB_STORAGE_VC_NAME, responseText, key);
}

export async function getResponseFromIndexedDB(did, url) {
	const db = await dbPromise;
	const key = `${did}-${url}`;
	return db.get(DB_STORAGE_VC_NAME, key);
}
