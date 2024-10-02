import { VerifiableCredentialFormat } from "../schemas/vc"

export type StorableCredential = {
	credentialIdentifier: string;
	format: VerifiableCredentialFormat;
	credential: string;
};
