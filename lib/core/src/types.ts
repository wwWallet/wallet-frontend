
export enum VerifiableCredentialFormat {
	VC_SDJWT = "vc+sd-jwt",
	MSO_MDOC = "mso_mdoc",
}

export type CredentialIssuer = {
	id: string; // must have the value of "iss" attribute of an SD-JWT VC credential 
	name: string;

	// ...other metadata
}

export type CredentialClaims = Record<string, unknown>;


export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

export type ParsedCredential = {
	metadata: {
		credential: {
			format: VerifiableCredentialFormat,
			name: string,
			image: {
				dataUri: string;
			},
		},
		issuer: CredentialIssuer,
	},
	signedClaims: CredentialClaims,
};