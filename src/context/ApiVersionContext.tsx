/**
 * ApiVersionContext - React context for API version management.
 *
 * This context provides:
 * - The detected backend API version
 * - Feature availability checks
 * - Loading state during initial detection
 *
 * The API version is auto-detected from the backend's /status endpoint
 * and cached for the session. Components can check feature availability
 * without making additional network requests.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
	getApiVersion,
	refreshApiVersion,
	getApiFeatures,
	ApiVersionInfo,
	DEFAULT_API_VERSION,
	API_VERSION_DISCOVER_AND_TRUST,
} from '@/lib/services/ApiVersionService';

interface ApiVersionContextValue {
	/** The detected API version (or default if not yet loaded) */
	apiVersion: number;
	/** Whether the API version is still being loaded */
	isLoading: boolean;
	/** Feature availability flags */
	features: ApiVersionInfo['features'];
	/** Force refresh the API version from the backend */
	refresh: () => Promise<void>;
	/** Check if a specific API version is supported */
	supportsVersion: (version: number) => boolean;
}

const ApiVersionContext = createContext<ApiVersionContextValue>({
	apiVersion: DEFAULT_API_VERSION,
	isLoading: true,
	features: {
		discoverAndTrust: false,
	},
	refresh: async () => {},
	supportsVersion: () => false,
});

export function ApiVersionProvider({ children }: React.PropsWithChildren) {
	const [apiVersion, setApiVersion] = useState<number>(DEFAULT_API_VERSION);
	const [isLoading, setIsLoading] = useState(true);

	const loadApiVersion = useCallback(async () => {
		setIsLoading(true);
		try {
			const version = await getApiVersion();
			setApiVersion(version);
		} catch (error) {
			console.error('Failed to load API version:', error);
			setApiVersion(DEFAULT_API_VERSION);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		try {
			const version = await refreshApiVersion();
			setApiVersion(version);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadApiVersion();
	}, [loadApiVersion]);

	const features = useMemo(() => getApiFeatures(apiVersion).features, [apiVersion]);

	const supportsVersion = useCallback(
		(version: number) => apiVersion >= version,
		[apiVersion]
	);

	const value = useMemo<ApiVersionContextValue>(
		() => ({
			apiVersion,
			isLoading,
			features,
			refresh,
			supportsVersion,
		}),
		[apiVersion, isLoading, features, refresh, supportsVersion]
	);

	return (
		<ApiVersionContext.Provider value={value}>
			{children}
		</ApiVersionContext.Provider>
	);
}

/**
 * Hook to access the API version context.
 */
export function useApiVersion(): ApiVersionContextValue {
	const context = useContext(ApiVersionContext);
	if (!context) {
		throw new Error('useApiVersion must be used within an ApiVersionProvider');
	}
	return context;
}

/**
 * Hook to check if discover-and-trust is available.
 * Returns { available, isLoading } for convenient checks.
 */
export function useDiscoverAndTrust(): { available: boolean; isLoading: boolean } {
	const { features, isLoading } = useApiVersion();
	return {
		available: features.discoverAndTrust,
		isLoading,
	};
}

// Export the context for direct access if needed
export default ApiVersionContext;
