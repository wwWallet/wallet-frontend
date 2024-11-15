import axios, { AxiosResponse, AxiosHeaders } from "axios";
import { BACKEND_URL } from "../../config";
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from "../../util";

export const get = async (path: string, headers?: AxiosHeaders): Promise<AxiosResponse> => {
	return await axios.get(
		`${BACKEND_URL}${path}`,
		{
			headers,
			transformResponse,
		},
	);
}

export const post = async (path: string, body: object, headers?: AxiosHeaders): Promise<AxiosResponse> => {
	try {
		return await axios.post(
			`${BACKEND_URL}${path}`,
			body,
			{
				headers,
				transformRequest: (data) => jsonStringifyTaggedBinary(data),
				transformResponse,
			},
		);
	} catch (e) {
		if (e?.response?.status === 412 && (e?.response?.headers ?? {})['x-private-data-etag']) {
			return Promise.reject({ cause: 'x-private-data-etag' });
		}
		throw e;
	}
}

export const del = async (path: string, headers?: AxiosHeaders): Promise<AxiosResponse> => {
	try {
		return await axios.delete(
			`${BACKEND_URL}${path}`,
			{
				headers,
				transformResponse,
			});
	} catch (e) {
		if (e?.response?.status === 412 && (e?.response?.headers ?? {})['x-private-data-etag']) {
			return Promise.reject({ cause: 'x-private-data-etag' });
		}
		throw e;
	}
}

const transformResponse = (data: any): any => {
	if (!data) return data;
	return jsonParseTaggedBinary(data);
}

const ApiClient = {
	get,
	post,
	del,
};

export default ApiClient;
