import { VerifiableCredentialFormat } from "wallet-common/dist/types";

export enum VerifiablePresentationFormat {
	VP_JWT = "vp_jwt"
}

export type VerifiableCredential = {
	credential: object | string;
	format: VerifiableCredentialFormat
}

export type VerifiablePresentation = {
	presentation: object | string;
	format: VerifiablePresentationFormat;
}
