/**
 * AuthZEN client module for trust evaluation.
 *
 * This module provides a TypeScript client for interacting with the wallet backend's
 * AuthZEN proxy endpoints, enabling frontend-driven trust decisions for credential
 * issuers and verifiers.
 *
 * @example
 * ```typescript
 * import { AuthZENClient, TrustStatus } from 'wallet-common';
 *
 * const client = AuthZENClient({
 *   httpClient: defaultHttpClient,
 *   baseUrl: 'https://wallet-backend.example.com',
 *   getAuthToken: () => authService.getToken(),
 *   tenantId: 'tenant1',
 * });
 *
 * const result = await client.evaluateVerifier({
 *   clientId: 'did:web:verifier.example.com',
 *   keyMaterial: { type: 'jwk', key: jwk },
 * });
 *
 * if (result.ok && result.value.status === TrustStatus.TRUSTED) {
 *   console.log(`Trusted verifier: ${result.value.name}`);
 * }
 * ```
 */
export { AuthZENSubject, AuthZENResource, AuthZENAction, AuthZENEvaluationRequest, AuthZENEvaluationResponseContext, AuthZENEvaluationResponse, AuthZENResolveRequest, AuthZENErrorCode, AuthZENError, TrustStatus, TrustInfo, } from './types';
export { AuthZENClient, IAuthZENClient, AuthZENClientConfig, KeyMaterial, EvaluateVerifierOptions, EvaluateIssuerOptions, } from './AuthZENClient';
//# sourceMappingURL=index.d.ts.map