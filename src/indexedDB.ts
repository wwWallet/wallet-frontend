// src/indexedDB.ts
import localforage from 'localforage';
import { UserId } from './api/types';
import { fromBase64Url } from './util';

const stores = {
	users: localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'users',
	}),
	UserHandleToUserID: localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'UserHandleToUserID',
	}),
	vc: localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'vc',
	}),
	vp: localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'vp',
	}),
	externalEntities: localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'externalEntities',
	}),
	accountInfo: localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'accountInfo',
	}),
};

const storeNameMapping: { [key: string]: string } = {
	'users': 'users',
	'vc': 'vc',
	'/storage/vc': 'vc',
	'vp': 'vp',
	'/storage/vp': 'vp',
	'/issuer/all': 'externalEntities',
	'/verifier/all': 'externalEntities',
	'/user/session/account-info': 'accountInfo'
};

function getMappedStoreName(storeName: string): string {
	if (storeName.includes('well-known')) {
		return 'externalEntities';
	}
	const mappedStoreName = storeNameMapping[storeName];
	if (!mappedStoreName) {
		throw new Error(`Store name ${storeName} does not exist in the mapping.`);
	}
	return mappedStoreName;
}

export async function initializeDataSource(): Promise<void> {
	try {
		await stores.users.ready();
		await stores.vc.ready();
		await stores.vp.ready();
		await stores.externalEntities.ready();

		await migrateDataSource();

		console.log('Database initialized successfully');
	} catch (err) {
		console.error('Error initializing database', err);
	}
}

async function migrateDataSource(): Promise<void> {
	await migration1();
}

/** Re-key the local databases from numeric user ID to uuid */
async function migration1(): Promise<void> {
	const UserHandleToUserID = localforage.createInstance({
		name: 'AppDataSource',
		storeName: 'UserHandleToUserID',
	});
	await UserHandleToUserID.ready();
	await stores.users.ready();
	const userHandles = await UserHandleToUserID.keys();
	await Promise.all(userHandles.map(async (userHandleB64u) => {
		const userId = UserId.fromUserHandle(fromBase64Url(userHandleB64u));
		const userNumericId: string = (await UserHandleToUserID.getItem(userHandleB64u)).toString();
		console.log("Migrating UserHandleToUserID:", [userHandleB64u, userNumericId]);

		const user: any = await stores.users.getItem(userNumericId);
		if (user) {
			user.uuid = userId.id;
			delete user["id"];
			delete user["webauthnUserHandle"];
			await stores.users.setItem(user.uuid, user);
			await stores.users.removeItem(userNumericId);
		}

		const accountInfo: any = await stores.accountInfo.getItem(userNumericId);
		if (accountInfo) {
			accountInfo.uuid = userId.id;
			delete accountInfo["webauthnUserHandle"];
			await stores.accountInfo.setItem(user.uuid, accountInfo);
			await stores.accountInfo.removeItem(userNumericId);
		}

		const vc: any = await stores.vc.getItem(userNumericId);
		if (vc) {
			await stores.vc.setItem(user.uuid, vc);
			await stores.vc.removeItem(userNumericId);
		}

		const vp: any = await stores.vp.getItem(userNumericId);
		if (vp) {
			await stores.vp.setItem(user.uuid, vp);
			await stores.vp.removeItem(userNumericId);
		}
	}));
	await UserHandleToUserID.dropInstance();
}

export async function addItem(storeName: string, key: any, value: any): Promise<void> {
	try {
		const mappedStoreName = getMappedStoreName(storeName);
		await stores[mappedStoreName].setItem(key, value);
	} catch (err) {
		console.error('Error adding item', err);
	}
}

export async function getItem(storeName: string, key: any): Promise<any> {
	try {
		const mappedStoreName = getMappedStoreName(storeName);
		const value = await stores[mappedStoreName].getItem(key);
		return value;
	} catch (err) {
		console.error('Error retrieving item', err);
		return null;
	}
}

export async function getAllItems(storeName: string): Promise<any[]> {
	try {
		const mappedStoreName = getMappedStoreName(storeName);
		const items: any[] = [];
		await stores[mappedStoreName].iterate((value, key) => {
			items.push({ key, value });
		});
		console.log('All items retrieved successfully');
		return items;
	} catch (err) {
		console.error('Error retrieving all items', err);
		return [];
	}
}
