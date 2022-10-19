export type DidDocument = {
	"@context": string[],
	id: string,
	verificationMethod: VerificationMethod[],
	authentication: string[],
	assertionMethod: string[]
}

export type VerificationMethod = {
	id: string,
	type: string,
	controller: string,
	publicKeyJwk: PublicKeyJwk
}

export type PublicKeyJwk = any