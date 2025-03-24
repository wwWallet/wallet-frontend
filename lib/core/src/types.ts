
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
			format: VerifiableCredentialFormat.VC_SDJWT,
			vct: string,
			name: string,
			metadataDocuments: Record<string, unknown>[],
			image: {
				dataUri: string,
			},
		} | {
			format: VerifiableCredentialFormat.MSO_MDOC,
			doctype: string,
			name: string,
			image: {
				dataUri: string,
			},
		},
		issuer: CredentialIssuer,
	},
	validityInfo: {
		validUntil?: Date,
		validFrom?: Date,
		signed?: Date,
	}
	signedClaims: CredentialClaims,
};
