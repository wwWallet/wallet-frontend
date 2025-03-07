import { JWK } from "jose";
import { CredentialParsingError, CredentialVerificationError, PublicKeyResolutionError, CredentialRenderingError, ValidatePresentationRequirementsError } from "./error";
import { Result, ParsedCredential, CredentialClaims } from "./types";
import { CredentialConfigurationSupported } from "./schemas";

export interface CredentialRendering {
	renderSvgTemplate(args: {
		json: any;
		credentialImageSvgTemplate: string;
		sdJwtVcMetadataClaims: any;
	}): Promise<string | null>
}

export interface OpenID4VCICredentialRendering {
	renderCustomSvgTemplate(args: { signedClaims: CredentialClaims, displayConfig: any }): Promise<string>;
}


export interface ParsingEngineI {
	register(parser: CredentialParser): void;
	parse({ rawCredential }: { rawCredential: unknown }): Promise<Result<ParsedCredential, CredentialParsingError>>;
}

export interface VerifyingEngineI {
	register(credentialVerifier: CredentialVerifier): void;
	verify({ rawCredential, opts }: { rawCredential: unknown, opts: { expectedNonce?: string, expectedAudience?: string, holderNonce?: string, responseUri?: string } }): Promise<Result<{ holderPublicKey: JWK; }, CredentialVerificationError>>;
}

export interface PublicKeyResolverEngineI {
	register(resolver: PublicKeyResolver): void;
	resolve(args: { identifier: string }): Promise<Result<{
		jwk: JWK
	}, PublicKeyResolutionError>>;
}


export interface CredentialParser {
	parse(args: { rawCredential: unknown }): Promise<Result<ParsedCredential, CredentialParsingError>>;
}

export interface CredentialVerifier {
	verify(args: { rawCredential: unknown, opts: { expectedNonce?: string, expectedAudience?: string, holderNonce?: string, responseUri?: string } }): Promise<Result<{
		holderPublicKey: JWK,
	}, CredentialVerificationError>>;
}


export interface PublicKeyResolver {
	resolve(args: { identifier: string }): Promise<Result<{
		jwk: JWK
	}, PublicKeyResolutionError>>;
}

export interface HttpClient {
	get(url: string, headers?: Record<string, unknown>, options?: any): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }>;
	post(url: string, body: any, headers?: Record<string, unknown>, options?: any): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }>;
}




export interface Context {
	clockTolerance: number;
	lang: string;
	subtle: SubtleCrypto;
	/**
	 * each string is Base64-encoded DER representation without line breaks or headers like -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----
	 */
	trustedCertificates: string[];
}
