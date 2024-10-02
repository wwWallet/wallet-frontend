export interface IHttpProxy {
	get(url: string, headers: any): Promise<any>;
	post(url: string, body: any, headers: any): Promise<any>;
}
