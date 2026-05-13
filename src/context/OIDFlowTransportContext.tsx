/**
 * Flow Transport Context
 *
 * This context provides the transport abstraction to React components.
 * It handles transport selection, lifecycle management, and provides
 * hooks for accessing the active transport.
 *
 * The context queries /status on the engine endpoint to discover capabilities
 * before enabling WebSocket transport.
 */

import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import type { IOIDFlowTransport } from '@/lib/openid-flow/types/IOIDFlowTransport';
import { nullOIDFlowTransport } from '@/lib/openid-flow/types/IOIDFlowTransport';
import { OIDFlowHttpProxyTransport } from '@/lib/openid-flow/transports/OIDFlowHttpProxyTransport';
import { OIDFlowWebSocketTransport } from '@/lib/openid-flow/transports/OIDFlowWebSocketTransport';
import type { SignRequestHandler, MatchRequestHandler } from '@/lib/openid-flow/transports/OIDFlowWebSocketTransport';
import { useHttpProxy } from '@/lib/services/HttpProxy/HttpProxy';
import {
	Capabilities,
	getEngineCapabilities,
} from '@/lib/services/CapabilitiesService';
import {
	WS_URL,
	HTTP_PROXY_TRANSPORT_ALLOWED,
	WEBSOCKET_TRANSPORT_ALLOWED,
	DIRECT_TRANSPORT_ALLOWED,
	TRANSPORT_PREFERENCE,
	BACKEND_URL,
} from '@/config';
import type { OIDFlowActiveTransportType, OIDFlowTransportType } from '@/lib/openid-flow/types/OIDFlowTypes';
import { logger } from '@/logger';
import { createIssuerTrustEvaluator, createVerifierTrustEvaluator } from '@/lib/services/TrustEvaluator';
import { TrustEvaluators } from '@/lib/openid-flow';

// Re-export sign and match types with WS prefix for clarity
export type {
	SignRequest as WSSignRequest,
	SignResponse as WSSignResponse,
	SignRequestHandler as WSSignRequestHandler,
	MatchRequest as WSMatchRequest,
	MatchResponse as WSMatchResponse,
	MatchRequestHandler as WSMatchRequestHandler,
} from '@/lib/openid-flow/transports/OIDFlowWebSocketTransport';

/**
 * Value provided by the OIDFlowTransportContext
 */
interface OIDFlowTransportContextValue {
	/** The active transport instance */
	transport: IOIDFlowTransport;
	/** The type of the active transport */
	transportType: OIDFlowActiveTransportType;
	/** Whether the transport is currently connected */
	isConnected: boolean;
	/** Attempt to reconnect (for WebSocket) */
	reconnect: () => Promise<void>;
	/** List of available transports based on configuration and capabilities */
	availableTransports: OIDFlowTransportType[];
	/** Error from the last transport operation */
	lastError: Error | null;
	/** Clear the last error */
	clearError: () => void;
	/** Whether capabilities have been loaded from the engine */
	capabilitiesLoaded: boolean;
	/** Engine capabilities (for debugging/display) */
	engineCapabilities: string[];
	/** Register a sign request handler (for WebSocket) */
	registerSignHandler: (handler: SignRequestHandler) => () => void;
	/** Register a match request handler for client-side credential matching (for WebSocket) */
	registerMatchHandler: (handler: MatchRequestHandler) => () => void;
	/** Whether transport selection has settled (safe to start flows) */
	transportReady: boolean;
}

const TRANSPORT_CONNECT_TIMEOUT = 10 * 1000;

const OIDFlowTransportContext = createContext<OIDFlowTransportContextValue | null>(null);

interface OIDFlowTransportProviderProps {
	children: React.ReactNode;
	/** Auth token for WebSocket connection */
	authToken: string | null;
	/** Tenant ID for multi-tenant routing */
	tenantId: string;
}

/**
 * Provider component for the transport context
 */
export const OIDFlowTransportProvider: React.FC<OIDFlowTransportProviderProps> = ({
	children,
	authToken,
	tenantId
}) => {
	const httpProxy = useHttpProxy();

	const [isConnected, setIsConnected] = useState(false);
	const [wsTransport, setWsTransport] = useState<OIDFlowWebSocketTransport | null>(null);
	const [lastError, setLastError] = useState<Error | null>(null);

	// Engine capabilities state
	const [capabilitiesLoaded, setCapabilitiesLoaded] = useState(false);
	const [engineCapabilities, setEngineCapabilities] = useState<string[]>([]);
	const [wsCapabilityAvailable, setWsCapabilityAvailable] = useState(false);

	const [pendingTransports, setPendingTransports] = useState<Set<OIDFlowTransportType>>(new Set());

	const transportReady = useMemo(() => {
		// 1. Wait for engine capabilities
		if (!capabilitiesLoaded) return false;
		// 2. Wait for any transport mid-connection
		if (pendingTransports.size > 0) return false;
		// 3. If WebSocket is expected, wait for it to connect or fail
		const wsExpected = WEBSOCKET_TRANSPORT_ALLOWED && wsCapabilityAvailable && !!WS_URL && !!authToken;
		if (wsExpected && !isConnected && !lastError) return false;
		return true;
	}, [capabilitiesLoaded, pendingTransports, wsCapabilityAvailable, authToken, isConnected, lastError]);

	const trustEvaluators = useMemo((): TrustEvaluators => {
		const evaluateIssuerTrust = createIssuerTrustEvaluator({
			httpClient: httpProxy,
			backendUrl: BACKEND_URL,
			getAuthToken: () => authToken ?? '',
			tenantId,
		});

		const evaluateVerifierTrust = createVerifierTrustEvaluator({
			httpClient: httpProxy,
			backendUrl: BACKEND_URL,
			getAuthToken: () => authToken ?? '',
			tenantId,
		});

		return {
		evaluateIssuerTrust,
		evaluateVerifierTrust,
		};
	}, [tenantId, authToken, httpProxy]);

	// Fetch engine capabilities on mount
	useEffect(() => {
		let cancelled = false;

		async function fetchCapabilities() {
			try {
				const caps = await getEngineCapabilities();
				if (cancelled) return;

				setEngineCapabilities(caps);
				setWsCapabilityAvailable(caps.includes(Capabilities.WEBSOCKET));
				setCapabilitiesLoaded(true);
			} catch (error) {
				logger.warn('Failed to fetch engine capabilities:', error);
				if (!cancelled) {
					setCapabilitiesLoaded(true);
					setWsCapabilityAvailable(false);
				}
			}
		}

		fetchCapabilities();

		return () => {
			cancelled = true;
		};
	}, []);

	// Determine which transports are available based on config AND capabilities
	const availableTransports = useMemo(() => {
		const available: OIDFlowTransportType[] = [];
		if (HTTP_PROXY_TRANSPORT_ALLOWED) available.push('http_proxy');
		// Only add websocket if config allows AND engine has capability
		if (WEBSOCKET_TRANSPORT_ALLOWED && WS_URL && wsCapabilityAvailable) {
			available.push('websocket');
		}
		if (DIRECT_TRANSPORT_ALLOWED) available.push('direct');
		return available;
	}, [wsCapabilityAvailable]);

	// Create HTTP proxy transport only if allowed
	const httpTransport = useMemo(() => {
		if (!HTTP_PROXY_TRANSPORT_ALLOWED) return null;
		return new OIDFlowHttpProxyTransport(httpProxy);
	}, [httpProxy]);

	// Create and manage WebSocket transport (only if capability is available)
	useEffect(() => {
		if (!capabilitiesLoaded) return;
		if (!WEBSOCKET_TRANSPORT_ALLOWED || !wsCapabilityAvailable || !WS_URL || !authToken) {
			setWsTransport(null);
			setIsConnected(false);
			return;
		}

		let cancelled = false;
		const ws = new OIDFlowWebSocketTransport(WS_URL, authToken, tenantId, trustEvaluators);
		setWsTransport(ws);

		// Mark this transport as pending connection
		setPendingTransports(prev => new Set(prev).add('websocket'));

		const connectTimeout = setTimeout(() => {
			if (cancelled) return;
			cancelled = true;

			logger.warn('WebSocket connection timed out');
			ws.disconnect();

			setIsConnected(false);
			setLastError(new Error('WebSocket connection timed out'));

			setPendingTransports(prev => {
				const next = new Set(prev);
				next.delete('websocket');
				return next;
			});
		}, TRANSPORT_CONNECT_TIMEOUT);

		(async () => {
			try {
				await ws.connect();

				if (cancelled) return;
				clearTimeout(connectTimeout);
				setIsConnected(true);
				setLastError(null);
			} catch (error) {
				if (cancelled) return;
				clearTimeout(connectTimeout);
				logger.error('WebSocket connection failed:', error);
				setIsConnected(false);
				setLastError(error);
			} finally {
				if (cancelled) return;
				clearTimeout(connectTimeout);
				setPendingTransports(prev => {
					const next = new Set(prev);
					next.delete('websocket');
					return next;
				});
			}
		})();

		const unsubscribeError = ws.onError((error) => {
			logger.error('WebSocket error:', error);
			setIsConnected(false);
			setLastError(error);
		});

		return () => {
			cancelled = true;
			clearTimeout(connectTimeout);
			unsubscribeError();
			ws.disconnect();
			// Clean up pending state for this transport on unmount/re-run
			setPendingTransports(prev => {
				const next = new Set(prev);
				next.delete('websocket');
				return next;
			});
		};
	}, [authToken, tenantId, capabilitiesLoaded, wsCapabilityAvailable, trustEvaluators]);

	// Update auth token and tenant ID on WebSocket when they change
	useEffect(() => {
		if (wsTransport && authToken) {
			wsTransport.updateAuthToken(authToken, tenantId);
		}
	}, [wsTransport, authToken, tenantId]);

	// Mobile WebViews can background the app during external redirects, causing
	// WebSocket disconnects. Reconnect when page becomes visible or network returns.
	useEffect(() => {
		if (!wsTransport || !WEBSOCKET_TRANSPORT_ALLOWED || !authToken) return;

		const attemptReconnect = async () => {
			if (wsTransport.isConnected()) {
				logger.debug('WebSocket reconnect skipped: already connected');
				return;
			}

			logger.debug('WebSocket reconnect triggered by app foreground/online', {
				online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
				visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
				tenantId,
				hasAuthToken: !!authToken,
			});

			// Reset the retry counter so the transport gets a fresh backoff budget after
			// the automatic 5 retries were already exhausted while the network was down.
			wsTransport.resetReconnectAttempts();
			try {
				await wsTransport.connect();
				setIsConnected(true);
				setLastError(null);
			} catch (error) {
				logger.warn('WebSocket foreground/online reconnect failed:', error);
				setIsConnected(false);
				setLastError(error instanceof Error ? error : new Error('WebSocket reconnect failed'));
			}
		};

		const onVisibilityChange = () => {
			logger.debug('visibilitychange event observed for WebSocket reconnect', {
				visibilityState: document.visibilityState,
				online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
			});
			if (document.visibilityState === 'visible') {
				void attemptReconnect();
			}
		};

		const onOnline = () => {
			logger.debug('Online event observed for WebSocket reconnect');
			void attemptReconnect();
		};

		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('online', onOnline);

		return () => {
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('online', onOnline);
		};
	}, [wsTransport, authToken]);

	// Select active transport based on preference order and availability
	const { transport, transportType } = useMemo(() => {
		// Follow TRANSPORT_PREFERENCE order
		for (const pref of TRANSPORT_PREFERENCE) {
			if (!availableTransports.includes(pref)) continue;

			switch (pref) {
				case 'websocket':
					if (wsTransport && isConnected) {
						return { transport: wsTransport, transportType: 'websocket' as const };
					}
					break;
				case 'http_proxy':
					if (httpTransport) {
						return { transport: httpTransport, transportType: 'http_proxy' as const };
					}
					break;
				case 'direct':
					// Direct transport not yet implemented
					// Will be added when ecosystem supports CORS
					break;
			}
		}

		// No transport available
		return { transport: nullOIDFlowTransport, transportType: 'none' as const };
	}, [availableTransports, wsTransport, isConnected, httpTransport]);

	// Reconnect function for WebSocket
	const reconnect = useCallback(async () => {
		if (wsTransport && WEBSOCKET_TRANSPORT_ALLOWED) {
			try {
				await wsTransport.connect();
				setIsConnected(true);
				setLastError(null);
			} catch (error) {
				setLastError(error instanceof Error ? error : new Error('Reconnection failed'));
				throw error;
			}
		}
	}, [wsTransport]);

	const clearError = useCallback(() => {
		setLastError(null);
	}, []);

	// Register sign handler on WebSocket transport
	const registerSignHandler = useCallback((handler: SignRequestHandler): (() => void) => {
		if (wsTransport) {
			return wsTransport.onSignRequest(handler);
		}
		// Return no-op unsubscribe if no WebSocket transport
		return () => {};
	}, [wsTransport]);

	// Register match handler on WebSocket transport for client-side credential matching
	const registerMatchHandler = useCallback((handler: MatchRequestHandler): (() => void) => {
		if (wsTransport) {
			return wsTransport.onMatchRequest(handler);
		}
		// Return no-op unsubscribe if no WebSocket transport
		return () => {};
	}, [wsTransport]);

	const value = useMemo(() => ({
		transport,
		transportType,
		isConnected: transportType === 'websocket' ? isConnected : transportType === 'http_proxy',
		reconnect,
		availableTransports,
		lastError,
		clearError,
		capabilitiesLoaded,
		engineCapabilities,
		registerSignHandler,
		registerMatchHandler,
		transportReady,
	}), [transport, transportType, isConnected, reconnect, availableTransports, lastError, clearError, capabilitiesLoaded, engineCapabilities, registerSignHandler, registerMatchHandler, transportReady]);

	return (
		<OIDFlowTransportContext.Provider value={value}>
			{children}
		</OIDFlowTransportContext.Provider>
	);
};

/**
 * Hook to access the flow transport
 *
 * @throws Error if used outside OIDFlowTransportProvider or no transport is configured
 */
export const useOIDFlowTransport = (): OIDFlowTransportContextValue => {
	const context = useContext(OIDFlowTransportContext);

	if (!context) {
		throw new Error('useOIDFlowTransport must be used within OIDFlowTransportProvider');
	}

	return context;
};

/**
 * Hook to access the flow transport with optional error handling
 * Does not throw if no transport is available
 */
export const useOIDFlowTransportSafe = (): OIDFlowTransportContextValue | null => {
	return useContext(OIDFlowTransportContext);
};

export default OIDFlowTransportContext;
