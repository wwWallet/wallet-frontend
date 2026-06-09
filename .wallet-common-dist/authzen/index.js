"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthZENClient = exports.TrustStatus = exports.AuthZENErrorCode = void 0;
var types_1 = require("./types");
Object.defineProperty(exports, "AuthZENErrorCode", { enumerable: true, get: function () { return types_1.AuthZENErrorCode; } });
Object.defineProperty(exports, "TrustStatus", { enumerable: true, get: function () { return types_1.TrustStatus; } });
var AuthZENClient_1 = require("./AuthZENClient");
// Client
Object.defineProperty(exports, "AuthZENClient", { enumerable: true, get: function () { return AuthZENClient_1.AuthZENClient; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXV0aHplbi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJCRzs7O0FBRUgsaUNBYWlCO0FBSmhCLHlHQUFBLGdCQUFnQixPQUFBO0FBRWhCLG9HQUFBLFdBQVcsT0FBQTtBQUlaLGlEQVF5QjtBQVB4QixTQUFTO0FBQ1QsOEdBQUEsYUFBYSxPQUFBIn0=