"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthZENClient = AuthZENClient;
const Result_1 = require("../core/Result");
const types_1 = require("./types");
/**
 * Creates an AuthZEN client for trust evaluation.
 */
function AuthZENClient(config) {
    const { httpClient, baseUrl, getAuthToken, tenantId, timeout = 30000 } = config;
    // Normalize base URL (remove trailing slash)
    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    /**
     * Build request headers with auth token.
     */
    async function buildHeaders() {
        const token = await Promise.resolve(getAuthToken());
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId,
            'Content-Type': 'application/json',
        };
    }
    /**
     * Parse error response.
     */
    function parseError(status, data) {
        if (typeof data === 'object' && data !== null) {
            const errorData = data;
            return {
                error: errorData.error || mapStatusToError(status),
                details: errorData.details || errorData.message,
            };
        }
        return {
            error: mapStatusToError(status),
            details: 'Unknown error',
        };
    }
    /**
     * Map HTTP status to error code.
     */
    function mapStatusToError(status) {
        switch (status) {
            case 400:
                return types_1.AuthZENErrorCode.INVALID_REQUEST;
            case 401:
                return types_1.AuthZENErrorCode.UNAUTHORIZED;
            case 403:
                return types_1.AuthZENErrorCode.FORBIDDEN;
            case 503:
                return types_1.AuthZENErrorCode.NOT_CONFIGURED;
            case 502:
                return types_1.AuthZENErrorCode.PDP_ERROR;
            default:
                return types_1.AuthZENErrorCode.NETWORK_ERROR;
        }
    }
    /**
     * Convert evaluation response to TrustInfo.
     */
    function toTrustInfo(response) {
        const info = {
            status: response.decision ? types_1.TrustStatus.TRUSTED : types_1.TrustStatus.UNTRUSTED,
            metadata: response.context?.trust_metadata,
        };
        // Try to extract name from metadata
        const metadata = response.context?.trust_metadata;
        if (metadata && typeof metadata === 'object') {
            const meta = metadata;
            // DID Document name
            if (meta.name && typeof meta.name === 'string') {
                info.name = meta.name;
            }
            // OIDF Entity Statement organization name
            if (meta.metadata && typeof meta.metadata === 'object') {
                const entityMeta = meta.metadata;
                const orgInfo = entityMeta.openid_credential_issuer || entityMeta.openid_relying_party || entityMeta.federation_entity;
                if (orgInfo && typeof orgInfo === 'object') {
                    const org = orgInfo;
                    if (org.organization_name && typeof org.organization_name === 'string') {
                        info.name = org.organization_name;
                    }
                    if (org.logo_uri && typeof org.logo_uri === 'string') {
                        info.logo = org.logo_uri;
                    }
                }
            }
        }
        return info;
    }
    return {
        async evaluate(request) {
            try {
                const headers = await buildHeaders();
                const response = await httpClient.post(`${normalizedBaseUrl}/v1/evaluate`, request, headers, { timeout });
                if (response.status === 200) {
                    return (0, Result_1.ok)(response.data);
                }
                return (0, Result_1.err)(parseError(response.status, response.data));
            }
            catch (error) {
                return (0, Result_1.err)({
                    error: types_1.AuthZENErrorCode.NETWORK_ERROR,
                    details: error instanceof Error ? error.message : 'Network error',
                });
            }
        },
        async resolve(subjectId) {
            try {
                const headers = await buildHeaders();
                const request = { subject_id: subjectId };
                const response = await httpClient.post(`${normalizedBaseUrl}/v1/resolve`, request, headers, { timeout });
                if (response.status === 200) {
                    return (0, Result_1.ok)(response.data);
                }
                return (0, Result_1.err)(parseError(response.status, response.data));
            }
            catch (error) {
                return (0, Result_1.err)({
                    error: types_1.AuthZENErrorCode.NETWORK_ERROR,
                    details: error instanceof Error ? error.message : 'Network error',
                });
            }
        },
        async evaluateVerifier(options) {
            const request = {
                subject: {
                    type: 'key',
                    id: options.clientId,
                },
                resource: {
                    type: options.keyMaterial.type,
                    id: options.clientId,
                    key: Array.isArray(options.keyMaterial.key)
                        ? options.keyMaterial.key
                        : [options.keyMaterial.key],
                },
                action: {
                    name: 'credential-verifier',
                },
                context: options.context,
            };
            const result = await this.evaluate(request);
            if (!result.ok) {
                return (0, Result_1.err)(result.error);
            }
            return (0, Result_1.ok)(toTrustInfo(result.value));
        },
        async evaluateIssuer(options) {
            const request = {
                subject: {
                    type: 'key',
                    id: options.issuerId,
                },
                resource: {
                    type: options.keyMaterial.type,
                    id: options.issuerId,
                    key: Array.isArray(options.keyMaterial.key)
                        ? options.keyMaterial.key
                        : [options.keyMaterial.key],
                },
                action: {
                    name: 'credential-issuer',
                },
                context: options.context,
            };
            const result = await this.evaluate(request);
            if (!result.ok) {
                return (0, Result_1.err)(result.error);
            }
            return (0, Result_1.ok)(toTrustInfo(result.value));
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXV0aFpFTkNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRoemVuL0F1dGhaRU5DbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTBCRzs7QUFpSUgsc0NBbU1DO0FBalVELDJDQUFpRDtBQUNqRCxtQ0FRaUI7QUFrSGpCOztHQUVHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLE1BQTJCO0lBQ3hELE1BQU0sRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsT0FBTyxHQUFHLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQztJQUVoRiw2Q0FBNkM7SUFDN0MsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVyRDs7T0FFRztJQUNILEtBQUssVUFBVSxZQUFZO1FBQzFCLE1BQU0sS0FBSyxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELE9BQU87WUFDTixlQUFlLEVBQUUsVUFBVSxLQUFLLEVBQUU7WUFDbEMsYUFBYSxFQUFFLFFBQVE7WUFDdkIsY0FBYyxFQUFFLGtCQUFrQjtTQUNsQyxDQUFDO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUyxVQUFVLENBQUMsTUFBYyxFQUFFLElBQWE7UUFDaEQsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxLQUFLLElBQUksRUFBRSxDQUFDO1lBQy9DLE1BQU0sU0FBUyxHQUFHLElBQStCLENBQUM7WUFDbEQsT0FBTztnQkFDTixLQUFLLEVBQUcsU0FBUyxDQUFDLEtBQWdCLElBQUksZ0JBQWdCLENBQUMsTUFBTSxDQUFDO2dCQUM5RCxPQUFPLEVBQUcsU0FBUyxDQUFDLE9BQWtCLElBQUssU0FBUyxDQUFDLE9BQWtCO2FBQ3ZFLENBQUM7UUFDSCxD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