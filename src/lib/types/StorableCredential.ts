import { VerifiableCredentialFormat } from "wallet-common";


export type StorableCredential = {
	credentialIdentifier: string;
	format: VerifiableCredentialFormat;
	credential: string;
	credentialConfigurationId: string;
	credentialIssuerIdentifier: string;
	instanceId: number;
	sigCount: number;
};
