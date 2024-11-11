import { OpenID4VCIClient } from './OpenID4VCIClient';
import { IHttpProxy } from '../interfaces/IHttpProxy';
import { ClientConfig } from '../types/ClientConfig';
import { IOpenID4VCIClientStateRepository } from '../interfaces/IOpenID4VCIClientStateRepository';
import { StorableCredential } from '../types/StorableCredential';

export class OpenID4VCIClientFactory {

	constructor(private httpProxy: IHttpProxy,
		private openID4VCIClientStateRepository: IOpenID4VCIClientStateRepository,
		private generateNonceProofs: (requests: { nonce: string, audience: string, issuer: string }[]) => Promise<{ proof_jwts: string[] }>,
		private storeCredential: (c: StorableCredential) => Promise<void>,
		private authorizationRequestModifier: (credentialIssuerIdentifier: string, url: string, request_uri?: string, client_id?: string) => Promise<{ url: string }>,
	) { }

	createClient(config: ClientConfig): OpenID4VCIClient {
		return new OpenID4VCIClient(config, this.httpProxy, this.openID4VCIClientStateRepository, this.generateNonceProofs, this.storeCredential, this.authorizationRequestModifier);
	}
}
