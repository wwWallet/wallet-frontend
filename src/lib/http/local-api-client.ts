import { addItem, getItem } from "../../indexedDB";

export const get = async (path: string, dbKey?: string): Promise<any> => {
	return await getItem(path, dbKey);
}

export const post = async (path: string, dbKey: string, data: object): Promise<any> => {
	return await addItem(path, dbKey, data);
}

const LocalApiClient = {
	get,
	post,
};

export default LocalApiClient;
