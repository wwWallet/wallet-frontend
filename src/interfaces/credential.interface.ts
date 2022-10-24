import Polyglot from "node-polyglot";

export interface Credentials {
	polyglot: Polyglot;
  credentials: CredentialEntity[];
	loaded?: boolean;
}

export interface CredentialEntity {
	id: number;
	identifier: string;
	jwt: string;
	holderDID: string;
	issuerDID: string;
	issuerInstitution: string;
	type: string;
}

export interface SelectableCredentials {
	polyglot: Polyglot;
  credentials: CredentialEntity[];
	loaded?: boolean;
	handleSelectVc(credentialId: string): void;
	handleDeselectVc(credentialId: string): void;
}