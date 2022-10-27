import Polyglot from "node-polyglot";

export interface Credentials {
	polyglot: Polyglot;
  credentials: CredentialEntity[];
	loaded?: boolean;
}

export interface CredentialEntity {
	id: number;
	holderDID: string;
	credential: string;
	type: "jwt_vc" | "ldp_vc";
}

export interface SelectableCredentials {
	polyglot: Polyglot;
  credentials: CredentialEntity[];
	loaded?: boolean;
	handleSelectVc(credentialId: string): void;
	handleDeselectVc(credentialId: string): void;
}

export interface VerifiableCredential {
	vc: VCPayload;
	iss: string;
	iat: number;
	nbf: number;
	jti: string;
}

export interface VCPayload {
	credentialSubject: any;
	"@context": string[];
	type: string[];
	issuer: string,
	issuanceDate: string,
	issued: string,
	validFrom: string,
	id: string,
	credentialSchema: any
}