export enum VerifiableCredentialFormat {
	SD_JWT_VC = "vc+sd-jwt",
	VC_JWT = "vc_jwt",
	MSO_MDOC = "mso_mdoc"
}

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
