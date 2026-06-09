/**
 * AuthZEN types for trust evaluation.
 *
 * These types mirror the AuthZEN Trust Registry Profile specification
 * as implemented by go-trust.
 *
 * @see https://openid.github.io/authzen/
 */
/**
 * Subject identifies the entity being evaluated (issuer, verifier, etc.).
 */
export interface AuthZENSubject {
    /**
     * Type of the subject. Per the AuthZEN Trust Registry Profile, this should
     * always be "key" for trust evaluation requests.
     */
    type: 'key' | string;
    /**
     * Identifier of the subject. This is typically:
     * - A DID (e.g., "did:web:example.com")
     * - An HTTPS URL for OIDF entities (e.g., "https://issuer.example.com")
     * - A client_id value (e.g., "x509_san_dns:verifier.example.com")
     */
    id: string;
}
/**
 * Resource contains the key material being evaluated.
 */
export interface AuthZENResource {
    /**
     * Type of key material:
     * - "jwk": JSON Web Key
     * - "x5c": X.509 certificate chain (base64-encoded DER)
     * - "x509_san_dns": X.509 with SAN DNS name validation
     * - "resolution": Resolution-only request (no key validation)
     */
    type: 'jwk' | 'x5c' | 'x509_san_dns' | 'resolution' | string;
    /**
     * Identifier matching the subject.id.
     */
    id: string;
    /**
     * Key material. For JWK, this is an array containing the JWK object.
     * For x5c, this is an array of base64-encoded DER certificates.
     */
    key?: unknown[];
}
/**
 * Action specifies the role/action being evaluated.
 */
export interface AuthZENAction {
    /**
     * Name of the action/role:
     * - "credential-issuer": Credential issuer validation
     * - "credential-verifier": Verifier/RP validation
     * - "wallet-provider": Wallet provider attestation
     * - "pid-provider": PID provider validation
     * - "mdl-issuer": mDL issuer validation
     *
     * When empty/undefined, indicates a resolution-only request.
     */
    name: string;
}
/**
 * EvaluationRequest is sent to the AuthZEN PDP for trust evaluation.
 */
export interface AuthZENEvaluationRequest {
    /**
     * Subject being evaluated (issuer, verifier, etc.).
     */
    subject: AuthZENSubject;
    /**
     * Resource containing key material for validation.
     */
    resource: AuthZENResource;
    /**
     * Action/role constraint. Optional for resolution-only requests.
     */
    action?: AuthZENAction;
    /**
     * Additional context for policy evaluation.
     * Can include trust framework constraints, allowed domains, etc.
     */
    context?: Record<string, unknown>;
}
/**
 * EvaluationResponseContext contains metadata about the trust decision.
 */
export interface AuthZENEvaluationResponseContext {
    /**
     * Identifier echoed from the request.
     */
    id?: string;
    /**
     * Whether the subject was successfully resolved (metadata fetched).
     */
    resolved?: boolean;
    /**
     * Reason for the decision. Includes policy information for debugging.
     */
    reason?: Record<string, unknown>;
    /**
     * Trust metadata returned by the PDP. This can be:
     * - A DID Document (for did: subjects)
     * - An OIDF Entity Configuration (for https:// subjects)
     * - Certificate chain information (for x5c resources)
     */
    trust_metadata?: Record<string, unknown>;
}
/**
 * EvaluationResponse is returned by the AuthZEN PDP.
 */
export interface AuthZENEvaluationResponse {
    /**
     * Whether the subject is trusted for the requested action.
     */
    decision: boolean;
    /**
     * Additional context about the decision.
     */
    context?: AuthZENEvaluationResponseContext;
}
/**
 * ResolveRequest is a simplified request for metadata resolution only.
 */
export interface AuthZENResolveRequest {
    /**
     * Subject ID to resolve (DID, URL, etc.).
     */
    subject_id: string;
}
/**
 * Error codes that can be returned by the AuthZEN proxy.
 */
export declare enum AuthZENErrorCode {
    /** Request was malformed or missing required fields */
    INVALID_REQUEST = "invalid_request",
    /** Authentication failed (invalid/missing JWT) */
    UNAUTHORIZED = "unauthorized",
    /** Query was not authorized by policy */
    FORBIDDEN = "forbidden",
    /** Trust evaluation is not configured */
    NOT_CONFIGURED = "not_configured",
    /** PDP request failed */
    PDP_ERROR = "pdp_error",
    /** Network or timeout error */
    NETWORK_ERROR = "network_error"
}
/**
 * Error response from the AuthZEN proxy.
 */
export interface AuthZENError {
    /**
     * Error code.
     */
    error: AuthZENErrorCode | string;
    /**
     * Human-readable error description.
     */
    details?: string;
}
/**
 * Trust status for display purposes.
 */
export declare enum TrustStatus {
    /** Entity is trusted per policy */
    TRUSTED = "trusted",
    /** Entity is not trusted */
    UNTRUSTED = "untrusted",
    /** Trust evaluation is pending/in-progress */
    PENDING = "pending",
    /** Trust could not be evaluated (error) */
    UNKNOWN = "unknown"
}
/**
 * Resolved trust information for an entity.
 */
export interface TrustInfo {
    /**
     * Trust decision from the PDP.
     */
    status: TrustStatus;
    /**
     * Human-readable name of the entity (if resolved).
     */
    name?: string;
    /**
     * Logo/icon URL for the entity (if available).
     */
    logo?: string;
    /**
     * Trust metadata (DID doc, entity config, etc.).
     */
    metadata?: unknown;
    /**
     * Error if trust evaluation failed.
     */
    error?: AuthZENError;
}
//# sourceMappingURL=types.d.ts.map