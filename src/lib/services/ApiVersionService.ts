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
		const apiVersion = response.data?.api_version;
		if (typeof apiVersion === 'string') {
			const parsed = parseInt(apiVersion, 10);
			return isNaN(parsed) ? DEFAULT_API_VERSION : parsed;
		}
		if (typeof apiVersion === 'number') {
			return apiVersion;
		}

		return DEFAULT_API_VERSION;
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

	cachedApiVersion = await fetchApiVersion();
	cacheTimestamp = now;
	return cachedApiVersion;
}

/**
 * Forces a fresh fetch of the API version, updating the cache.
 */
export async function refreshApiVersion(): Promise<number> {
	cachedApiVersion = await fetchApiVersion();
	cacheTimestamp = Date.now();
	return cachedApiVersion;
}

/**
 * Checks if a specific feature is available based on the cached API version.
 * If the version hasn't been fetched yet, assumes DEFAULT_API_VERSION.
 */
export function isFeatureAvailable(minVersion: number): boolean {
	if (cachedApiVersion === null) {
		return DEFAULT_API_VERSION >= minVersion;
	}
	return cachedApiVersion >= minVersion;
}

/**
 * Gets the current cached version (or default if not yet fetched).
 * Use this for synchronous checks when you've already called getApiVersion().
 */
export function getCachedApiVersion(): number {
	return cachedApiVersion ?? DEFAULT_API_VERSION;
}
