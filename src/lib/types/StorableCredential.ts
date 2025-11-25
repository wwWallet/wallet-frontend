import { VerifiableCredentialFormat } from "wallet-common/dist/types";


export type StorableCredential = {
	credentialIdentifier: string;
	format: VerifiableCredentialFormat;
	credential: string;
	credentialConfigurationId: string;
	credentialIssuerIdentifier: string;
	instanceId: number;
	sigCount: number;
};
