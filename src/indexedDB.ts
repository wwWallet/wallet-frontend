// src/indexedDB.ts
import localforage from 'localforage';

const stores = {
  user: localforage.createInstance({
    name: 'AppDataSource',
    storeName: 'user',
  }),
};

export async function initializeDataSource(): Promise<void> {
  try {
    await stores.user.ready();
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
  }
}

export async function addItem(storeName: string, value: any): Promise<void> {
  try {
    await stores[storeName].setItem(value.id, value);
    console.log('Item added successfully');
  } catch (err) {
    console.error('Error adding item', err);
  }
}

export async function getItem(storeName: string, key: string): Promise<any> {
  try {
    const value = await stores[storeName].getItem(key);
    console.log('Item retrieved successfully');
    return value;
  } catch (err) {
    console.error('Error retrieving item', err);
    return null;
  }
}

export async function getAllItems(storeName: string): Promise<any[]> {
  try {
    const items: any[] = [];
    await stores[storeName].iterate((value, key) => {
      items.push({ key, value });
    });
    console.log('All items retrieved successfully');
    return items;
  } catch (err) {
    console.error('Error retrieving all items', err);
    return [];
  }
}
