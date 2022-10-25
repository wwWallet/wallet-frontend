import { CredentialEntity } from "./credential.interface";

export type CreateVpRequestDTO = {
	alg: string;
	format: 'jwt_vp' | 'ldp_vp';

	/**
	 * a list of credential entities
	 */
	
	credentialEntities: CredentialEntity[];
	audience: string;
	nonce: string;
}
