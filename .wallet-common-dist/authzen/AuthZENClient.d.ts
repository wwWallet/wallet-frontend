/**
 * AuthZEN client for trust evaluation via the wallet backend proxy.
 *
 * This client provides an interface for the frontend to make trust decisions
 * by calling the wallet backend's /v1/evaluate endpoint, which proxies requests
 * to the configured AuthZEN PDP (Policy Decision Point).
 *
 * @example
 * ```typescript
 * const client = AuthZENClient({
 *   httpClient: defaultHttpClient,
 *   baseUrl: 'https://wallet-backend.example.com',
 *   getAuthToken: () => authService.getToken(),
 *   tenantId: 'default',
 * });
 *
 * // Evaluate a verifier's trust status
 * const result = await client.evaluateVerifier({
 *   clientId: 'did:web:verifier.example.com',
 *   keyMaterial: { type: 'jwk', key: verifierJwk },
 * });
 *
 * if (result.ok && result.value.decision) {
 *   // Verifier is trusted
 * }
 * ```
 */
import { HttpClient } from '../interfaces';
import { Result } from '../core/Result';
import { AuthZENEvaluationRequest, AuthZENEvaluationResponse, AuthZENError, TrustInfo } from './types';
/**
 * Configuration for the AuthZEN client.
 */
export interface AuthZENClientConfig {
    /**
     * HTTP client for making requests.
     */
    httpClient: HttpClient;
    /**
     * Base URL of the wallet backend (e.g., "https://wallet-backend.example.com").
     */
    baseUrl: string;
    /**
     * Function to retrieve the current auth token (JWT).
     */
    getAuthToken: () => string | Promise<string>;
    /**
     * Tenant ID for the X-Tenant-ID header.
     */
    tenantId: string;
    /**
     * Request timeout in milliseconds (default: 30000).
     */
    timeout?: number;
}
/**
 * Key material for trust evaluation.
 */
export interface KeyMaterial {
    /**
     * Type of key material.
     */
    type: 'jwk' | 'x5c' | 'x509_san_dns' | 'kid';
    /**
     * Key data. For JWK, this is the JWK object.
     * For x5c, this is an array of base64-encoded certificates.
     * For kid, this is the key ID string (requires resolution).
     */
    key: unknown | unknown[];
}
/**
 * Options for evaluating a verifier.
 */
export interface EvaluateVerifierOptions {
    /**
     * The client_id of the verifier (may include scheme prefix).
     */
    clientId: string;
    /**
     * Key material extracted from the request JWT.
     */
    keyMaterial: KeyMaterial;
    /**
     * Additional context for policy evaluation.
     */
    context?: Record<string, unknown>;
}
/**
 * Options for evaluating an issuer.
 */
export interface EvaluateIssuerOptions {
    /**
     * The issuer identifier (typically the `iss` claim).
     */
    issuerId: string;
    /**
     * Key material from the issuer metadata or credential JWT.
     */
    keyMaterial: KeyMaterial;
    /**
     * Additional context for policy evaluation.
     */
    context?: Record<string, unknown>;
}
/**
 * AuthZEN client interface.
 */
export interface IAuthZENClient {
    /**
     * Send a raw AuthZEN evaluation request.
     */
    evaluate(request: AuthZENEvaluationRequest): Promise<Result<AuthZENEvaluationResponse, AuthZENError>>;
    /**
     * Resolve metadata for a subject (DID document, entity config, etc.).
     */
    resolve(subjectId: string): Promise<Result<AuthZENEvaluationResponse, AuthZENError>>;
    /**
     * Evaluate a verifier's trust status.
     */
    evaluateVerifier(options: EvaluateVerifierOptions): Promise<Result<TrustInfo, AuthZENError>>;
    /**
     * Evaluate an issuer's trust status.
     */
    evaluateIssuer(options: EvaluateIssuerOptions): Promise<Result<TrustInfo, AuthZENError>>;
}
/**
 * Creates an AuthZEN client for trust evaluation.
 */
export declare function AuthZENClient(config: AuthZENClientConfig): IAuthZENClient;
//# sourceMappingURL=AuthZENClient.d.ts.map