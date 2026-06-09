import type { JWK } from "jose";
import type { TrustStatus } from "../../authzen/types";
export type ClaimRecord = {
    key: string;
    name: string;
    value: string;
};
export type PresentationClaims = Record<string, ClaimRecord[]>;
export type PresentationInfo = {
    [descriptor_id: string]: Array<string>;
};
export interface RPState {
    session_id: string;
    is_cross_device: boolean;
    signed_request: string;
    state: string;
    nonce: string;
    callback_endpoint: string | null;
    audience: string;
    presentation_request_id: string;
    presentation_definition: unknown | null;
    dcql_query: unknown | null;
    rp_eph_kid: string;
    rp_eph_pub: JWK;
    rp_eph_priv: JWK;
    apv_jarm_encrypted_response_header: string | null;
    apu_jarm_encrypted_response_header: string | null;
    encrypted_response: string | null;
    vp_token: string | null;
    presentation_submission: unknown | null;
    response_code: string | null;
    claims: PresentationClaims | null;
    completed: boolean | null;
    presentation_during_issuance_session: string | null;
    date_created: number;
}
export type CredentialEngineOptions = {
    clockTolerance: number;
    subtle: SubtleCrypto;
    lang: string;
    trustedCertificates: string[];
    trustedCredentialIssuerIdentifiers: string[] | undefined;
};
export type OpenID4VPOptions = {
    credentialEngineOptions: CredentialEngineOptions;
    redirectUri: string;
};
export type CredentialIssuerMetadata = {
    mdoc_iacas_uri?: string;
};
export type IacasResponse = {
    iacas?: Array<{
        certificate?: string;
    }>;
};
export declare enum OpenID4VPResponseMode {
    DIRECT_POST = "direct_post",
    DIRECT_POST_JWT = "direct_post.jwt",
    DC_API = "dc_api",
    DC_API_JWT = "dc_api.jwt"
}
export type VPFormatAlgorithms = {
    alg_values_supported?: string[];
    "sd-jwt_alg_values"?: string[];
    "kb-jwt_alg_values"?: string[];
    alg?: string[];
};
export type OpenID4VPClientMetadata = {
    jwks?: {
        keys: any[];
    };
    jwks_uri?: string;
    authorization_encrypted_response_alg?: string;
    authorization_encrypted_response_enc?: string;
    vp_formats: Record<string, VPFormatAlgorithms>;
};
export type OpenID4VPRelyingPartyState = {
    nonce: string;
    response_uri: string;
    client_id: string;
    state: string;
    client_metadata: OpenID4VPClientMetadata;
    response_mode: OpenID4VPResponseMode;
    transaction_data: string[];
    dcql_query: Record<string, unknown>;
};
export type OpenID4VPServerMessages = {
    purposeNotSpecified: string;
    allClaimsRequested: string;
};
export type OpenID4VPServerLastUsedNonceStore = {
    get(): string | null;
    set(nonce: string): void;
};
/**
 * @deprecated All trust evaluation is now delegated to AuthZEN backend via evaluateTrust.
 * This type is kept for backwards compatibility but is no longer used.
 */
export type OpenID4VPServerRequestVerifier = (params: {
    request_uri: string;
    response_uri: string;
    parsedHeader: Record<string, unknown>;
}) => Promise<void>;
export type TransactionDataResponseParams = {
    transaction_data_hashes: string[];
    transaction_data_hashes_alg: string[];
};
export type TransactionDataResponseGenerator = {
    generateTransactionDataResponse(transaction_data: string[]): Promise<[TransactionDataResponseParams | null, Error | null]>;
};
export type TransactionDataResponseGeneratorParams = {
    descriptor_id: string;
    dcql_query: Record<string, unknown>;
};
/**
 * Parsed client_id scheme information.
 */
export type ClientIdScheme = {
    /**
     * The scheme type (e.g., 'x509_san_dns', 'did', 'https', 'pre-registered').
     */
    scheme: 'x509_san_dns' | 'did' | 'https' | 'pre-registered';
    /**
     * The full client_id value.
     */
    clientId: string;
    /**
     * For DID schemes, the full DID (e.g., 'did:web:example.com').
     * For x509_san_dns, the domain (e.g., 'example.com').
     * For https, the full URL.
     */
    identifier: string;
};
/**
 * Key material extracted from the request JWT for trust evaluation.
 */
export type OpenID4VPKeyMaterial = {
    /**
     * Key type: 'jwk' for JWK in header, 'x5c' for certificate chain, 'kid' for key ID reference (requires DID resolution).
     */
    type: 'jwk' | 'x5c' | 'kid';
    /**
     * The key data. JWK object, array of base64-encoded certificates, or key ID string.
     */
    key: unknown | unknown[];
};
/**
 * Trust evaluation result.
 */
export type TrustEvaluationResult = {
    /**
     * Whether the verifier is trusted.
     */
    trusted: boolean;
    /**
     * Detailed trust status from AuthZEN evaluation.
     * Provides more granular information than the boolean `trusted` field.
     */
    status?: TrustStatus;
    /**
     * Display name of the verifier (if resolved).
     */
    name?: string;
    /**
     * Logo URL of the verifier (if available).
     */
    logo?: string;
    /**
     * Additional metadata from trust evaluation.
     */
    metadata?: Record<string, unknown>;
};
/**
 * Trust evaluator function signature.
 * Returns trust evaluation result or throws on error.
 */
export type OpenID4VPTrustEvaluator = (params: {
    /**
     * Parsed client_id scheme information.
     */
    clientIdScheme: ClientIdScheme;
    /**
     * Key material from the request JWT header.
     */
    keyMaterial: OpenID4VPKeyMaterial;
    /**
     * Request URI (for hostname validation).
     */
    requestUri?: string;
    /**
     * Response URI (for hostname validation).
     */
    responseUri?: string;
}) => Promise<TrustEvaluationResult>;
/**
 * Verification method from a DID document.
 * Contains public key material for JWT verification.
 */
export type DIDVerificationMethod = {
    /**
     * The verification method ID (e.g., "did:web:example.com#key-1").
     */
    id: string;
    /**
     * The type of verification method (e.g., "JsonWebKey2020").
     */
    type: string;
    /**
     * The controller of this verification method.
     */
    controller: string;
    /**
     * Public key in JWK format (for JsonWebKey2020 and similar types).
     */
    publicKeyJwk?: JsonWebKey;
    /**
     * Public key as multibase-encoded string (for Ed25519VerificationKey2020 etc).
     */
    publicKeyMultibase?: string;
};
/**
 * Minimal DID Document structure for JWT verification.
 * @see https://www.w3.org/TR/did-core/
 */
export type DIDDocument = {
    /**
     * The DID that identifies this document.
     */
    id: string;
    /**
     * Verification methods containing public keys.
     */
    verificationMethod?: DIDVerificationMethod[];
    /**
     * Methods valid for authentication purposes.
     * Can be strings (references) or inline verification methods.
     */
    authentication?: (string | DIDVerificationMethod)[];
    /**
     * Methods valid for assertion / credential issuance.
     */
    assertionMethod?: (string | DIDVerificationMethod)[];
};
/**
 * Result of DID resolution.
 */
export type DIDResolutionResult = {
    /**
     * Whether resolution was successful.
     */
    resolved: boolean;
    /**
     * The resolved DID document (if successful).
     */
    didDocument?: DIDDocument;
    /**
     * Error message (if resolution failed).
     */
    error?: string;
    /**
     * Additional metadata from resolution.
     */
    metadata?: Record<string, unknown>;
};
/**
 * DID resolver function signature.
 * Resolves a DID to its document containing public keys.
 */
export type DIDResolver = (did: string) => Promise<DIDResolutionResult>;
//# sourceMappingURL=types.d.ts.map