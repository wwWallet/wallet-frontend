/**
 * Direct Transport (Stub)
 *
 * This transport implementation will allow the wallet frontend to make
 * direct CORS requests to credential issuers and verifiers, bypassing
 * the backend proxy entirely.
 *
 * This is currently a stub implementation for future development when
 * the OID4VCI/OID4VP ecosystem has better CORS support.
 *
 * Prerequisites for full implementation:
 * - Issuers/verifiers must support CORS from browser origins
 * - Must handle DPoP/mTLS requirements (challenging in browser)
 * - Need secure key storage for client credentials
 *
 * Discovery mechanism:
 * - Check issuer/.well-known/openid-credential-issuer for CORS headers
 * - Check verifier endpoints for Access-Control-Allow-Origin
 * - Fall back to proxy transport if CORS not available
 */

import type { IOIDFlowTransport } from '../types/IOIDFlowTransport';
import type { OIDFlowRequest, OIDFlowResponse, OIDFlowProgressEvent } from '../types/OIDFlowTypes';
import type { OID4VCIFlowParams, OID4VCIFlowResult } from '../types/OID4VCITypes';
import type { OID4VPFlowParams, OID4VPFlowResult } from '../types/OID4VPTypes';

/**
 * Result of CORS capability check
 */
export interface CorsCheckResult {
	/** Whether CORS is supported */
	supported: boolean;
	/** Origin(s) allowed, if detectable */
	allowedOrigins?: string[];
	/** Error message if check failed */
	error?: string;
}

/**
 * Direct Transport implementation (stub)
 *
 * This class provides placeholder implementation for direct
 * browser-to-issuer/verifier communication. Current implementation
 * throws "not implemented" errors as this transport mode is not
 * yet ready for production use.
 */
export class OIDFlowDirectTransport implements IOIDFlowTransport {
	private progressCallbacks = new Set<(event: OIDFlowProgressEvent) => void>();
	private errorCallbacks = new Set<(error: Error) => void>();
	private connected = false;

	// ===== Connection Lifecycle =====

	async connect(): Promise<void> {
		// For direct transport, "connect" validates browser capabilities
		// In stub mode, we just mark as connected
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.connected = false;
	}

	isConnected(): boolean {
		return this.connected;
	}

	// ===== OID4VCI Flow (Stub) =====

	async startOID4VCIFlow(_params: OID4VCIFlowParams): Promise<OID4VCIFlowResult> {
		throw new Error(
			'DirectTransport not implemented: OID4VCI direct browser requests ' +
			'require ecosystem-wide CORS support. Use WebSocket or HTTP proxy transport.'
		);
	}

	// ===== OID4VP Flow (Stub) =====

	async startOID4VPFlow(_params: OID4VPFlowParams): Promise<OID4VPFlowResult> {
		throw new Error(
			'DirectTransport not implemented: OID4VP direct browser requests ' +
			'require ecosystem-wide CORS support. Use WebSocket or HTTP proxy transport.'
		);
	}

	// ===== Generic Request (Stub) =====

	async request<T>(_flowRequest: OIDFlowRequest): Promise<OIDFlowResponse<T>> {
		throw new Error(
			'DirectTransport not implemented: Direct browser requests ' +
			'require ecosystem-wide CORS support. Use WebSocket or HTTP proxy transport.'
		);
	}

	// ===== Event Subscriptions =====

	onProgress(callback: (event: OIDFlowProgressEvent) => void): () => void {
		this.progressCallbacks.add(callback);
		return () => this.progressCallbacks.delete(callback);
	}

	onError(callback: (error: Error) => void): () => void {
		this.errorCallbacks.add(callback);
		return () => this.errorCallbacks.delete(callback);
	}

	// ===== CORS Discovery Methods =====

	/**
	 * Check if a URL supports CORS from the current origin
	 *
	 * This performs a preflight-style check to determine if
	 * direct browser requests would be allowed.
	 *
	 * @param url - The URL to check for CORS support
	 * @returns CorsCheckResult indicating CORS support status
	 */
	async checkCorsSupport(url: string): Promise<CorsCheckResult> {
		try {
			// Perform an OPTIONS request to check CORS headers
			// Most browsers will do this automatically, but we want
			// to proactively check before attempting real requests
			const response = await fetch(url, {
				method: 'OPTIONS',
				headers: {
					'Access-Control-Request-Method': 'POST',
					'Access-Control-Request-Headers': 'content-type,authorization',
				},
				mode: 'cors',
			});

			const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
			const allowMethods = response.headers.get('Access-Control-Allow-Methods');

			if (!allowOrigin) {
				return {
					supported: false,
					error: 'No Access-Control-Allow-Origin header',
				};
			}

			// Check if our origin is allowed
			const currentOrigin = window.location.origin;
			const isAllowed = allowOrigin === '*' ||
				allowOrigin === currentOrigin ||
				allowOrigin.includes(currentOrigin);

			if (!isAllowed) {
				return {
					supported: false,
					allowedOrigins: [allowOrigin],
					error: `Origin ${currentOrigin} not in allowed origins`,
				};
			}

			// Verify required methods are allowed
			const methods = allowMethods?.split(',').map(m => m.trim().toUpperCase()) ?? [];
			if (!methods.includes('POST') && !methods.includes('*')) {
				return {
					supported: false,
					error: 'POST method not allowed',
				};
			}

			return {
				supported: true,
				allowedOrigins: allowOrigin === '*' ? ['*'] : [allowOrigin],
			};
		} catch (error) {
			return {
				supported: false,
				error: error instanceof Error ? error.message : 'CORS check failed',
			};
		}
	}

	/**
	 * Check if an OID4VCI issuer supports direct browser requests
	 *
	 * @param issuerUrl - The issuer's base URL
	 * @returns CorsCheckResult for the issuer's credential endpoint
	 */
	async checkIssuerCorsSupport(issuerUrl: string): Promise<CorsCheckResult> {
		// Check the well-known endpoint first
		const parsed = new URL(issuerUrl);
		const wellKnownUrl = `${parsed.origin}/.well-known/openid-credential-issuer${parsed.pathname}`;
		const wellKnownResult = await this.checkCorsSupport(wellKnownUrl.toString());

		if (!wellKnownResult.supported) {
			return {
				supported: false,
				error: `Issuer metadata not CORS-accessible: ${wellKnownResult.error}`,
			};
		}

		return wellKnownResult;
	}

	/**
	 * Check if an OID4VP verifier supports direct browser requests
	 *
	 * @param verifierUrl - The verifier's authorization endpoint URL
	 * @returns CorsCheckResult for the verifier's endpoint
	 */
	async checkVerifierCorsSupport(verifierUrl: string): Promise<CorsCheckResult> {
		return this.checkCorsSupport(verifierUrl);
	}
}
