// src/indexedDB.ts
import localforage from 'localforage';

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
	'UserHandleToUserID': 'UserHandleToUserID',
	'vc': 'vc',
	'/storage/vc': 'vc',
	'vp': 'vp',
	'/storage/vp': 'vp',
	'/legal_person/issuers/all': 'externalEntities',
	'/verifiers/all': 'externalEntities',
	'/user/session/account-info': 'accountInfo'
};

function getMappedStoreName(storeName: string): string {
	const mappedStoreName = storeNameMapping[storeName];
	if (!mappedStoreName) {
		throw new Error(`Store name ${storeName} does not exist in the mapping.`);
	}
	return mappedStoreName;
}

export async function initializeDataSource(): Promise<void> {
	try {
		await stores.users.ready();
		await stores.UserHandleToUserID.ready();
		await stores.vc.ready();
		await stores.vp.ready();
		await stores.externalEntities.ready();
		console.log('Database initialized successfully');
	} catch (err) {
		console.error('Error initializing database', err);
	}
}

export async function addItem(storeName: string, key: any, value: any): Promise<void> {
	try {
		const mappedStoreName = getMappedStoreName(storeName);
		await stores[mappedStoreName].setItem(key, value);
		console.log('Item added successfully');
	} catch (err) {
		console.error('Error adding item', err);
	}
}

export async function getItem(storeName: string, key: any): Promise<any> {
	try {
		const mappedStoreName = getMappedStoreName(storeName);
		console.log(mappedStoreName, storeName);
		const value = await stores[mappedStoreName].getItem(key);
		console.log('Item retrieved successfully');
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
