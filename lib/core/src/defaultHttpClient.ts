import axios from "axios";
import { HttpClient } from "./interfaces";

export const defaultHttpClient: HttpClient = {
	async get(url, headers, opts) {
		return axios.get(url, { ...opts, headers: headers as any }).then((res) => (res?.data ? { status: res.status, data: res.data, headers: res.headers } : null)).catch((err) => (err?.response?.data ? { ...err.response.data } : {}));
	},
	async post(url, data, headers, opts) {
		return axios.post(url, data, { ...opts, headers: headers as any }).then((res) => (res?.data ? { status: res.status, data: res.data, headers: res.headers } : null)).catch((err) => (err?.response?.data ? { ...err.response.data } : {}));
	},
}
