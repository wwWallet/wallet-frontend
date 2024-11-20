import { IHttpProxy } from "../interfaces/IHttpProxy";
import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { OpenidAuthorizationServerMetadata, OpenidAuthorizationServerMetadataSchema } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata, OpenidCredentialIssuerMetadataSchema } from "../schemas/OpenidCredentialIssuerMetadataSchema";
import { addItem, getItem } from '../../indexedDB';

export class OpenID4VCIHelper implements IOpenID4VCIHelper {
	constructor(private httpProxy: IHttpProxy) { }

	private async fetchAndCache<T>(path: string, schema: any, isOnline: boolean, forceIndexDB: boolean): Promise<T> {
		if (!isOnline || forceIndexDB) {
			const cachedData = await getItem(path, path);
			if (cachedData) return cachedData;
		}

		// Fetch from network if online
		try {
			const response = await this.httpProxy.get(path, {});
			if (!response) throw new Error("Couldn't get response");

			const parsedData = schema.parse(response.data);
			await addItem(path, path, parsedData);  // Cache the fetched data
			return parsedData;
		} catch (err) {
			console.error(`Error fetching from ${path}:`, err);
			throw new Error(`Couldn't get data from ${path}`);
		}
	}

	// Fetches authorization server metadata with fallback
	async getAuthorizationServerMetadata(isOnline: boolean, credentialIssuerIdentifier: string, forceIndexDB: boolean = false): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null> {
		const pathAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
		const pathConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;

		try {
			const authzServeMetadata = await this.fetchAndCache<OpenidAuthorizationServerMetadata>(
				pathAuthorizationServer,
				OpenidAuthorizationServerMetadataSchema,
				isOnline,
				forceIndexDB
			);
			return { authzServeMetadata };
		} catch {
			// Fallback to openid-configuration if oauth-authorization-server fetch fails
			const authzServeMetadata = await this.fetchAndCache<OpenidAuthorizationServerMetadata>(
				pathConfiguration,
				OpenidAuthorizationServerMetadataSchema,
				isOnline,
				forceIndexDB
			).catch(() => null);

			if (!authzServeMetadata) {
				return null;
			}
			return { authzServeMetadata };
		}
	}

	// Fetches credential issuer metadata
	async getCredentialIssuerMetadata(isOnline: boolean, credentialIssuerIdentifier: string, forceIndexDB: boolean = false): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> {
		const pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;

		try {
			const metadata = await this.fetchAndCache<OpenidCredentialIssuerMetadata>(
				pathCredentialIssuer,
				OpenidCredentialIssuerMetadataSchema,
				isOnline,
				forceIndexDB
			);
			return { metadata };
		}
		catch(err) {
			console.error(err);
			return null;
		}

	}
}
