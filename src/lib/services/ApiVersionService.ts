/**
 * API Version Service
 *
 * Handles discovery and management of the backend API version.
 * The backend exposes an api_version field in the /status response
 * that indicates which API features are available.
 *
 * API Version History:
 * - Version 1: Original API (implicit, for backends that don't report api_version)
 * - Version 2: Adds /api/discover-and-trust endpoint for combined discovery + trust evaluation
 */

import axios from 'axios';
import { BACKEND_URL } from '@/config';

// Minimum version for specific features
export const API_VERSION_DISCOVER_AND_TRUST = 2;

// Default version when backend doesn't report one (backwards compatibility)
export const DEFAULT_API_VERSION = 1;

export interface ApiVersionInfo {
	version: number;
	features: {
		discoverAndTrust: boolean;
	};
}

/**
 * Fetches the API version from the backend status endpoint.
 * Returns DEFAULT_API_VERSION if the backend doesn't support api_version.
 */
export async function fetchApiVersion(): Promise<number> {
	try {
		const response = await axios.get(`${BACKEND_URL}/status`, {
			timeout: 5000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Extract api_version from response, default to 1 if not present
		const apiVersion = Number(response.data?.api_version);

		return isNaN(apiVersion) ? DEFAULT_API_VERSION : apiVersion;
	} catch (error) {
		console.warn('Failed to fetch API version from backend:', error);
		return DEFAULT_API_VERSION;
	}
}

/**
 * Determines available features based on the API version.
 */
export function getApiFeatures(version: number): ApiVersionInfo {
	return {
		version,
		features: {
			discoverAndTrust: version >= API_VERSION_DISCOVER_AND_TRUST,
		},
	};
}

/**
 * Cache for the discovered API version to avoid repeated calls.
 */
let cachedApiVersion: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Gets the API version, using cache when available.
 * Call refreshApiVersion() to force a fresh fetch.
 */
export async function getApiVersion(): Promise<number> {
	const now = Date.now();
	if (cachedApiVersion !== null && now - cacheTimestamp < CACHE_TTL_MS) {
		return cachedApiVersion;
	}

	return refreshApiVersion(now);
}

/**
 * Forces a fresh fetch of the API version, updating the cache.
 * @param timestamp - Optional timestamp for cache; defaults to Date.now()
 */
export async function refreshApiVersion(timestamp?: number): Promise<number> {
	cachedApiVersion = await fetchApiVersion();
	cacheTimestamp = timestamp ?? Date.now();
	return cachedApiVersion;
}

/**
 * Checks if the cached API version meets or exceeds the specified minimum.
 * If the version hasn't been fetched yet, assumes DEFAULT_API_VERSION.
 */
export function supportsApiVersion(minVersion: number): boolean {
	return getCachedApiVersion() >= minVersion;
}

/**
 * Gets the current cached version (or default if not yet fetched).
 * Use this for synchronous checks when you've already called getApiVersion().
 */
export function getCachedApiVersion(): number {
	return cachedApiVersion ?? DEFAULT_API_VERSION;
}
