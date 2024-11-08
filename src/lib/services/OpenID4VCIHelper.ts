import { IHttpProxy } from "../interfaces/IHttpProxy";
import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { OpenidAuthorizationServerMetadata, OpenidAuthorizationServerMetadataSchema } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata, OpenidCredentialIssuerMetadataSchema } from "../schemas/OpenidCredentialIssuerMetadataSchema";
import { addItem, getItem } from '../../indexedDB';


export class OpenID4VCIHelper implements IOpenID4VCIHelper {

	constructor(
		private httpProxy: IHttpProxy
	) { }

	async getAuthorizationServerMetadata(isOnline: boolean, credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata }> {

		let pathAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
		let response = null;
		// Online case
		if (!isOnline) {
			const authzServeMetadata = await getItem(pathAuthorizationServer, pathAuthorizationServer);
			if (authzServeMetadata) {
				return { authzServeMetadata };
			}
		}

		try {
			response = await this.httpProxy.get(pathAuthorizationServer, {});
			if (!response) {
				throw new Error("Couldn't get response");
			}
			const authzServeMetadata = OpenidAuthorizationServerMetadataSchema.parse(response.data);
			await addItem(pathAuthorizationServer, pathAuthorizationServer, { authzServeMetadata });
			return { authzServeMetadata };
		}
		catch (err) {
		}

		if (response == null) {

			let pathConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;
			// Online case
			if (!isOnline) {
				const authzServeMetadata = await getItem(pathConfiguration, pathConfiguration);
				if (authzServeMetadata) {
					return { authzServeMetadata };
				}
			}

			try {
				response = await this.httpProxy.get(pathConfiguration, {});
				if (!response) {
					throw new Error("Couldn't get response");
				}
				const authzServeMetadata = OpenidAuthorizationServerMetadataSchema.parse(response.data);
				await addItem(pathConfiguration, pathConfiguration, { authzServeMetadata });
				return { authzServeMetadata };
			} catch (err) {
				console.error(err);
				throw new Error("Couldn't get authorization server metadata");
			}
		}
	}

	async getCredentialIssuerMetadata(isOnline: boolean, credentialIssuerIdentifier: string): Promise<{ metadata: OpenidCredentialIssuerMetadata }> {

		let pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;
		// Online case
		if (!isOnline) {
			const metadata = await getItem(pathCredentialIssuer, pathCredentialIssuer);
			if (metadata) {
				return { metadata };
			}
		}

		try {
			const response = await this.httpProxy.get(pathCredentialIssuer, {});
			if (!response) {
				throw new Error("Couldn't get response");
			}
			const metadata = OpenidCredentialIssuerMetadataSchema.parse(response.data);
			await addItem(pathCredentialIssuer, pathCredentialIssuer, { metadata });
			return { metadata };
		}
		catch (err) {
			console.error(err);
			throw new Error("Couldn't get Credential Issuer Metadata");
		}
	}
}
