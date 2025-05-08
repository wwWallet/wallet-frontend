import { IHttpProxy } from "../interfaces/IHttpProxy";
import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { OpenidAuthorizationServerMetadata, OpenidAuthorizationServerMetadataSchema } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata, OpenidCredentialIssuerMetadataSchema } from "../schemas/OpenidCredentialIssuerMetadataSchema";
import { addItem, getItem } from '../../indexedDB';
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";

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
		const pathIssuerAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
		const pathIssuerConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;

		const credentialIssuerMetadata = await this.getCredentialIssuerMetadata(isOnline, credentialIssuerIdentifier).catch(() => null);
		const issuerAuthorizationServers = credentialIssuerMetadata.metadata.authorization_servers;

		// First, try all authorization servers in Issuer authorization_servers metadata
		for (const AuthorizationServer of issuerAuthorizationServers) {
			try {
				const pathAuthorizationServer = `${AuthorizationServer}/.well-known/openid-configuration`;
				const authzServeMetadata = await this.fetchAndCache<OpenidAuthorizationServerMetadata>(
					pathAuthorizationServer,
					OpenidAuthorizationServerMetadataSchema,
					isOnline,
					forceIndexDB
				);
				return { authzServeMetadata };
			} catch {
				console.log(`No valid openid-configuration found for ${AuthorizationServer}`);
			}
		}

		// Fallback to Issuer configuration
		try {
			const authzServeMetadata = await this.fetchAndCache<OpenidAuthorizationServerMetadata>(
				pathIssuerAuthorizationServer,
				OpenidAuthorizationServerMetadataSchema,
				isOnline,
				forceIndexDB
			);
			return { authzServeMetadata };
		} catch {
			// Fallback to openid-configuration if oauth-authorization-server fetch fails
			const authzServeMetadata = await this.fetchAndCache<OpenidAuthorizationServerMetadata>(
				pathIssuerConfiguration,
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
			if (metadata.signed_metadata) {
				try {
					const parsedHeader = JSON.parse(new TextDecoder().decode(base64url.decode(metadata.signed_metadata.split('.')[0])));
					if (parsedHeader.x5c) {
						const publicKey = await importX509(getPublicKeyFromB64Cert(parsedHeader.x5c[0]), parsedHeader.alg);
						const { payload } = await jwtVerify(metadata.signed_metadata, publicKey);
						return { metadata: payload as OpenidCredentialIssuerMetadata };
					}
					return null;
				}
				catch(err) {
					return null;
				}
			}
			return { metadata };
		}
		catch(err) {
			console.error(err);
			return null;
		}

	}
}
