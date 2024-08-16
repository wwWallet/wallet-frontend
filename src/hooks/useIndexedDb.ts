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

async function dbTransaction<T>(
	openDb: () => Promise<IDBDatabase>,
	objectStores: string[],
	mode: IDBTransactionMode,
	f: TransactionFunc<T>,
): Promise<T> {
	const db = await openDb();
	const tr = db.transaction(objectStores, mode);
	try {
		return await new Promise<T>((resolve, reject) => {
			const req = f(tr);
			req.onsuccess = () => resolve(req.result);
			req.onerror = (event) => reject(event);
		});
	} finally {
		db.close();
	}
}

export type TransactionFunc<T> = (transaction: IDBTransaction) => IDBRequest<T>;
export type DatabaseTransaction = <T>(objectStores: string[], f: TransactionFunc<T>) => Promise<T>;

export function useIndexedDb(
	dbName: string,
	version: number,
	upgrade: (db: IDBDatabase, prevVersion: number, newVersion: number) => void,
): { read: DatabaseTransaction, write: DatabaseTransaction, destroy: () => Promise<void>} {
	return useMemo(
		() => {
			const openDb = async () => await openIndexedDb(dbName, version, upgrade);

			const read: DatabaseTransaction = async (objectStores, f) => {
				return await dbTransaction(openDb, objectStores, "readonly", f);
			};
			const write: DatabaseTransaction = async (objectStores, f) => {
				return await dbTransaction(openDb, objectStores, "readwrite", f);
			};

			const destroy = async (): Promise<void> => {
				return new Promise((resolve, reject) => {
					const request = window.indexedDB.deleteDatabase(dbName);
					request.onsuccess = () => resolve();
					request.onerror = (event) => reject(event);
				});
			}

			return { read, write, destroy };
		},
		[dbName, version, upgrade],
	);
}
