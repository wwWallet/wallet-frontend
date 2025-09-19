export interface RequestHeaders {
}

export interface ResponseHeaders {
	'dpop-nonce'?: string;
	[other: string]: unknown;
}

export interface IHttpProxy {
	get(url: string, headers?: RequestHeaders, options?: Record<string, unknown>): Promise<{ status: number, headers: ResponseHeaders, data: unknown }>;
	post(url: string, body: any, headers?: RequestHeaders): Promise<{ status: number, headers: ResponseHeaders, data: unknown }>;
}
