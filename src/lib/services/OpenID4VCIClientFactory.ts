import { OpenID4VCIClient } from './OpenID4VCIClient';
import { IHttpProxy } from '../interfaces/IHttpProxy';
import { ClientConfig } from '../types/ClientConfig';
import { IOpenID4VCIClientStateRepository } from '../interfaces/IOpenID4VCIClientStateRepository';
import { StorableCredential } from '../types/StorableCredential';

export class OpenID4VCIClientFactory {

	constructor(private httpProxy: IHttpProxy,
		private openID4VCIClientStateRepository: IOpenID4VCIClientStateRepository,
		private generateNonceProof: (cNonce: string, audience: string, clientId: string) => Promise<{ jws: string }>,
		private storeCredential: (c: StorableCredential) => Promise<void>
	) { }

	createClient(config: ClientConfig): OpenID4VCIClient {
		return new OpenID4VCIClient(config, this.httpProxy, this.openID4VCIClientStateRepository, this.generateNonceProof, this.storeCredential);
	}
}
