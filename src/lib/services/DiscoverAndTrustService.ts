/**
 * Discover and Trust Service
 *
 * This service provides combined entity discovery and trust evaluation.
 * It's used when the backend supports API version 2+ (with /api/discover-and-trust endpoint).
 *
 * For older backends (API version 1), the frontend falls back to the legacy
 * behavior where discovery and trust evaluation are handled separately.
 */

import axios from 'axios';
import { BACKEND_URL } from '@/config';
import {
	getApiVersion,
	API_VERSION_DISCOVER_AND_TRUST,
	supportsApiVersion,
} from './ApiVersionService';

/**
 * Request payload for the discover-and-trust endpoint.
 */
export interface DiscoverAndTrustRequest {
	/** The issuer or verifier identifier (URL) */
	entity_identifier: string;
	/** Role: "issuer" or "verifier" */
	role: 'issuer' | 'verifier';
	/** Optional credential type (docType for mDOC, vct for SD-JWT) */
	credential_type?: string;
}

/**
 * Response from the discover-and-trust endpoint.
 */
export interface DiscoverAndTrustResponse {
	/** Discovered issuer metadata (if role=issuer) */
	issuer_metadata?: Record<string, unknown>;
	/** Discovered verifier metadata (if role=verifier) */
	verifier_metadata?: Record<string, unknown>;
	/** Whether the entity is trusted */
	trusted: boolean;
	/** Reason for the trust decision */
	reason: string;
	/** Trusted certificates in PEM format (if any) */
	trusted_certificates?: string[];
	/** Trust framework that authorized the entity */
	trust_framework?: string;
	/** Discovery status: "success", "partial", or "failed" */
	discovery_status: 'success' | 'partial' | 'failed';
	/** Error message if discovery failed */
	discovery_error?: string;
}

/**
 * Checks if the discover-and-trust feature is available.
 * This uses the cached API version for synchronous checks.
 * Call ensureApiVersionLoaded() first if you need a guaranteed check.
 */
export function isDiscoverAndTrustAvailable(): boolean {
	return supportsApiVersion(API_VERSION_DISCOVER_AND_TRUST);
}

/**
 * Ensures the API version has been loaded from the backend.
 * Call this during app initialization or before making feature availability checks.
 */
export async function ensureApiVersionLoaded(): Promise<number> {
	return await getApiVersion();
}

/**
 * Performs combined discovery and trust evaluation via the backend.
 * Only available when API version >= 2.
 *
 * @throws Error if the feature is not available or if the request fails
 */
export async function discoverAndTrust(
	request: DiscoverAndTrustRequest,
	authToken: string
): Promise<DiscoverAndTrustResponse> {
	await ensureApiVersionLoaded();

	if (!supportsApiVersion(API_VERSION_DISCOVER_AND_TRUST)) {
		throw new Error(
			`discover-and-trust requires API version ${API_VERSION_DISCOVER_AND_TRUST} or higher`
		);
	}

	const response = await axios.post<DiscoverAndTrustResponse>(
		`${BACKEND_URL}/api/discover-and-trust`,
		request,
		{
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			timeout: 30000, // 30 second timeout for discovery + trust evaluation
		}
	);

	return response.data;
}

/**
 * Discovers and evaluates trust for an issuer.
 * Convenience wrapper around discoverAndTrust.
 */
export async function discoverAndTrustIssuer(
	issuerIdentifier: string,
	authToken: string,
	credentialType?: string
): Promise<DiscoverAndTrustResponse> {
	return discoverAndTrust(
		{
			entity_identifier: issuerIdentifier,
			role: 'issuer',
			credential_type: credentialType,
		},
		authToken
	);
}

/**
 * Discovers and evaluates trust for a verifier.
 * Convenience wrapper around discoverAndTrust.
 */
export async function discoverAndTrustVerifier(
	verifierIdentifier: string,
	authToken: string,
	credentialType?: string
): Promise<DiscoverAndTrustResponse> {
	return discoverAndTrust(
		{
			entity_identifier: verifierIdentifier,
			role: 'verifier',
			credential_type: credentialType,
		},
		authToken
	);
}
