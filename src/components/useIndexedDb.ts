import { useMemo } from "react";


async function openIndexedDb(
	dbName: string,
	version: number,
	upgrade: (db: IDBDatabase, prevVersion: number, newVersion: number) => void,
): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open(dbName, version);
		request.onsuccess = () => resolve(request.result);
		request.onerror = (event) => reject(event);
		request.onupgradeneeded = (event) => {
			upgrade(request.result, event.oldVersion, event.newVersion);
		};
	});
}

async function dbTransaction(db: IDBDatabase, objectStores: string[], mode: IDBTransactionMode, f: (transaction: IDBTransaction) => IDBRequest): Promise<void> {
	const tr = db.transaction(objectStores, mode);
	return await new Promise((resolve, reject) => {
		const req = f(tr);
		req.onsuccess = () => resolve(req.result);
		req.onerror = (event) => reject(event);
	});
}

export type DatabaseTransaction = (objectStores: string[], f: (transaction: IDBTransaction) => IDBRequest) => Promise<any>;

export function useIndexedDb(
	dbName: string,
	version: number,
	upgrade: (db: IDBDatabase, prevVersion: number, newVersion: number) => void,
): [DatabaseTransaction, DatabaseTransaction] {
	return useMemo(
		() => {
			const db = openIndexedDb(dbName, version, upgrade);

			const read: DatabaseTransaction = async (objectStores, f): Promise<any> => {
				return await dbTransaction(await db, objectStores, "readonly", f);
			};
			const write: DatabaseTransaction = async (objectStores, f): Promise<any> => {
				return await dbTransaction(await db, objectStores, "readwrite", f);
			};

			return [read, write];
		},
		[dbName, version, upgrade],
	);
}
