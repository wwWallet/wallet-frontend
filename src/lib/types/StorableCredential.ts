import { VerifiableCredentialFormat } from "../schemas/vc"

export type StorableCredential = {
	credentialIdentifier: string;
	format: VerifiableCredentialFormat;
	credential: string;
	credentialConfigurationId: string;
	credentialIssuerIdentifier: string;
	instanceId: number;
	sigCount: number;
};
