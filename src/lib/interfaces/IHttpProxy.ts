export interface IHttpProxy {
	get(url: string, headers?: Record<string, unknown>): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }>;
	post(url: string, body: any, headers?: Record<string, unknown>): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }>;
}
