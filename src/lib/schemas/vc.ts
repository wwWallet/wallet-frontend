export enum VerifiableCredentialFormat {
	SD_JWT_VC = "vc+sd-jwt",
	VC_JWT = "vc_jwt",
	MSO_MDOC = "mso_mdoc",
	JWT_VC_JSON = "jwt_vc_json"
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
