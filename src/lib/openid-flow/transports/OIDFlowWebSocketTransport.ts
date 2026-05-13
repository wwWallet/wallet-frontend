/**
 * WebSocket Transport
 *
 * This transport implementation connects to the wallet backend via WebSocket
 * for orchestrating OID4VCI and OID4VP flows. The backend handles all external
 * HTTP requests and sends progress updates back through the WebSocket.
 *
 * Benefits over HTTP proxy:
 * - Lower latency (persistent connection)
 * - Real-time progress updates
 * - Server can orchestrate multi-step flows
 * - Better error handling with flow state
 */

import { TrustStatus as TrustStatusEnum } from 'wallet-common';
import type { IOIDFlowTransport } from '../types/IOIDFlowTransport';
import type {
	OIDFlowRequest,
	OIDFlowResponse,
	OIDFlowProgressEvent
} from '../types/OIDFlowTypes';
import type { OID4VCIFlowParams, OID4VCIFlowResult, OID4VCIIssuerInfo } from '../types/OID4VCITypes';
import type { OID4VPFlowParams, OID4VPFlowResult, OID4VPVerifierInfo } from '../types/OID4VPTypes';
import type { CredentialsMatchedResult } from '@/services/CredentialMatchingService';
import { logger } from '@/logger';
import { TrustEvaluators, TrustStatus } from '../types';
import { DcqlQuery } from 'dcql';

/**
 * Pending request waiting for a response
 */
interface PendingRequest<T = unknown> {
	resolve: (response: T) => void;
	reject: (error: Error) => void;
	flowId: string;
	timeout: ReturnType<typeof setTimeout>;
}

/**
 * WebSocket message from server
 */
interface ServerMessage {
	flow_id?: string;  // snake_case from backend
	flowId?: string;   // camelCase for backwards compat
	type: string;
	[key: string]: unknown;
}

interface ProofTypeConfig {
	key_attestations_required?: Record<string, unknown> | null;
	proof_signing_alg_values_supported: string[];
}

interface ProofTypesSupported {
	jwt?: ProofTypeConfig;
	attestation?: ProofTypeConfig;
	cwt?: ProofTypeConfig;
}

/**
 * Sign request from server
 */
export interface SignRequest {
	flowId: string;
	messageId: string;
	action: 'generate_proof' | 'sign_presentation';
	params: {
		audience?: string;
		nonce?: string;
		issuer?: string;
		proofType?: string;
		proofTypesSupported?: ProofTypesSupported;
		count?: number;
		credentialsToInclude?: Array<{
			credentialId: string;
			credentialQueryId?: string;
			disclosedClaims?: string[];
			credentialRaw?: string;
		}>;
		responseUri?: string;
		verifierJwkThumbprint?: string;
	};
}

/**
 * Individual proof object for OID4VCI
 */
export interface ProofObject {
	proof_type: 'jwt' | 'cwt' | 'attestation';
	jwt?: string;
	cwt?: string;
	attestation?: string;
}

/**
 * Sign response to send back to server
 */
export interface SignResponse {
	proofJwt?: string;       // single proof (legacy)
	proofs?: ProofObject[];  // batch proofs
	vpToken?: string;
}

/**
 * Sign request handler callback type
 */
export type SignRequestHandler = (request: SignRequest) => Promise<SignResponse>;

/**
 * Credential match request from server
 * Sent when server needs client to match credentials locally for privacy
 */
export interface MatchRequest {
	flowId: string;
	messageId: string;
	dcqlQuery: DcqlQuery.Input;
}

/**
 * Credential match response to send back to server.
 * Re-uses CredentialsMatchedResult shape from CredentialMatchingService.
 */
export type MatchResponse = CredentialsMatchedResult;

/**
 * Match request handler callback type
 */
export type MatchRequestHandler = (request: MatchRequest) => Promise<MatchResponse>;

/**
 * Flow action message to send to server
 */
export interface FlowAction {
	flowId: string;
	action: string;
	payload: Record<string, unknown>;
}

/**
 * WebSocket Transport implementation
 */
export class OIDFlowWebSocketTransport implements IOIDFlowTransport {
	private ws: WebSocket | null = null;
	private wsUrl: string;
	private authToken: string;
	private tenantId: string;

	private currentFlowId: string | null = null;

	private pending = new Map<string, PendingRequest>();
	private progressCallbacks = new Set<(event: OIDFlowProgressEvent) => void>();
	private errorCallbacks = new Set<(error: Error) => void>();
	private signHandlers = new Set<SignRequestHandler>();
	private matchHandlers = new Set<MatchRequestHandler>();
	private vpCredentialCache = new Map<string, string>();

	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectDelay = 1000;
	private requestTimeout = 60000; // 60 seconds

	private connectionPromise: Promise<void> | null = null;

	private trustEvaluators: TrustEvaluators;

	constructor(wsUrl: string, authToken: string, tenantId: string = 'default', trustEvaluators?: TrustEvaluators) {
		this.wsUrl = wsUrl;
		this.authToken = authToken;
		this.tenantId = tenantId;
		this.trustEvaluators = trustEvaluators ?? {
			evaluateIssuerTrust: async () => ({ trusted: false }),
			evaluateVerifierTrust: async () => ({ trusted: false }),
		};
	}

	getCurrentFlowId(): string | null {
		return this.currentFlowId;
	}

	// ===== Connection Lifecycle =====

	async connect(): Promise<void> {
		// If already connecting, return the existing promise
		if (this.connectionPromise) {
			return this.connectionPromise;
		}

		// If already connected, return immediately
		if (this.isConnected()) {
			return Promise.resolve();
		}

		this.connectionPromise = new Promise((resolve, reject) => {
			try {
				// Connect using the base WebSocket URL; send auth token in a message after connection
				const url = new URL(this.wsUrl);
				url.searchParams.set('tenant_id', this.tenantId);
				this.ws = new WebSocket(url);

				this.ws.onopen = () => {
					// Send auth token and tenant ID as first message for security (avoids logging in URL)
					try {
						if (this.ws && this.ws.readyState === WebSocket.OPEN) {
							this.ws.send(
								JSON.stringify({
									type: 'handshake',
									app_token: this.authToken,
								})
							);
						}
					} catch (e) {
						logger.error('Failed to send auth message over WebSocket:', e);
					}
					this.reconnectAttempts = 0;
					this.connectionPromise = null;
					resolve();
				};

				this.ws.onerror = (event) => {
					logger.error('WebSocket error:', event);
					this.connectionPromise = null;
					reject(new Error('WebSocket connection failed'));
				};

				this.ws.onmessage = (event) => {
					try {
						const message = JSON.parse(event.data) as ServerMessage;
						this.handleMessage(message);
					} catch (e) {
						logger.error('Failed to parse WebSocket message:', e);
					}
				};

				this.ws.onclose = (event) => {
					this.handleDisconnect(event);
				};
			} catch (error) {
				this.connectionPromise = null;
				reject(error);
			}
		});

		return this.connectionPromise;
	}

	async disconnect(): Promise<void> {
		if (this.ws) {
			// Cancel all pending requests
			Array.from(this.pending.entries()).forEach(([id, pending]) => {
				clearTimeout(pending.timeout);
				pending.reject(new Error('WebSocket disconnected'));
			});
			this.pending.clear();

			this.ws.close(1000, 'Client disconnect');
			this.ws = null;
		}
		this.currentFlowId = null;
		this.connectionPromise = null;
		this.vpCredentialCache.clear();
	}

	/**
	 * Reset the reconnect attempt counter so that a manually-triggered reconnect
	 * (e.g. from visibilitychange / online events) gets a fresh retry budget.
	 * Without this, once the 5 automatic retries are exhausted the transport is
	 * permanently dead even if the backend comes back a few seconds later.
	 */
	resetReconnectAttempts(): void {
		this.reconnectAttempts = 0;
	}

	isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN;
	}

	// ===== OID4VCI Flow =====

	async startOID4VCIFlow(params: OID4VCIFlowParams): Promise<OID4VCIFlowResult> {
		// Determine which phase of the flow we're in based on params

		// Resumption: same-tab redirect returned with auth code
		// We have both the saved offer AND the authorization code from the redirect URL
		if (params.authorizationCode && params.credentialOffer) {
			const response = await this.send({
				type: 'flow_start',
				protocol: 'oid4vci',
				offer: params.credentialOffer,
				redirect_uri: params.redirectUri,
				auth_code: params.authorizationCode,
				code_verifier: params.codeVerifier,
			});

			return this.mapOID4VCIResponse(response);
		}

		if (params.credentialOfferUri || params.credentialOffer) {
			// Phase 1: Start flow with credential offer
			const response = await this.send({
				type: 'flow_start',
				protocol: 'oid4vci',
				credential_offer_uri: params.credentialOfferUri,
				offer: params.credentialOffer,
				redirect_uri: params.redirectUri,  // Include redirect URI for authorization code flow continuation
			});

			return this.mapOID4VCIResponse(response);
		}

		if (params.holderBinding && params.credentialConfigurationId) {
			// Phase 2: User consented, provide holder binding
			const response = await this.send({
				type: 'flow_action',
				action: 'consent',
				payload: {
					holder_public_key: params.holderBinding.publicKeyJwk,
					holder_binding_method: params.holderBinding.method,
					credential_configuration_id: params.credentialConfigurationId,
				},
			});

			return this.mapOID4VCIResponse(response);
		}

		if (params.authorizationCode) {
			// Phase 3: Authorization code received
			const response = await this.send({
				type: 'flow_action',
				action: 'authorization_complete',
				payload: {
					code: params.authorizationCode,
					code_verifier: params.codeVerifier,
					state: params.state,
				},
			});

			return this.mapOID4VCIResponse(response);
		}

		if (params.preAuthorizedCode) {
			// Pre-authorized flow
			const response = await this.send({
				type: 'flow_action',
				action: 'provide_pin',
				payload: {
					pre_authorized_code: params.preAuthorizedCode,
					tx_code: params.txCodeInput,
				},
			});

			return this.mapOID4VCIResponse(response);
		}

		throw new Error('Invalid OID4VCI flow params: no valid entry point or continuation');
	}

	private mapOID4VCIResponse(response: ServerMessage): OID4VCIFlowResult {
		if (response.type === 'error' || response.type === 'flow_error') {
			return {
				success: false,
				error: {
					code: (response.error as { code?: string })?.code ?? 'UNKNOWN_ERROR',
					message: (response.error as { message?: string })?.message ?? 'Unknown error',
				},
			};
		}

		// Map server response to OID4VCIFlowResult
		const result: OID4VCIFlowResult = {
			success: true,
		};

		const payload = response.payload as Record<string, unknown> | undefined;

		// Metadata phase
		if (payload?.issuer_metadata) {
			result.issuerMetadata = payload.issuer_metadata as OID4VCIFlowResult['issuerMetadata'];
		}
		if (payload?.issuer_info) {
			result.issuerInfo = mapIssuerInfo(payload.issuer_info as Record<string, unknown>);
		}
		if (payload?.credential_configurations) {
			result.credentialConfigurations = payload.credential_configurations as OID4VCIFlowResult['credentialConfigurations'];
		}
		if (payload?.selected_credential_configuration_id) {
			result.selectedCredentialConfigurationId = payload.selected_credential_configuration_id as string;
		} else if (response.selected_credential_configuration_id) {
			result.selectedCredentialConfigurationId = response.selected_credential_configuration_id as string;
		}

		// Authorization
		if (payload?.authorization_required !== undefined) {
			result.authorizationRequired = payload.authorization_required as boolean;
		}
		if (payload?.authorization_url) {
			result.authorizationUrl = payload.authorization_url as string;
		}
		if (payload?.code_verifier) {
			result.codeVerifier = payload.code_verifier as string;
		}
		if (payload?.state) {
			result.issuerState = payload.state as string;
		}

		// Credential offer (for storage and resumption after redirect)
		if (payload?.credential_offer) {
			result.credentialOffer = payload.credential_offer as OID4VCIFlowResult['credentialOffer'];
		}

		// Selected credential configuration ID fallback from credential offer
		if (!result.selectedCredentialConfigurationId && result.credentialOffer?.credential_configuration_ids?.length) {
			result.selectedCredentialConfigurationId = result.credentialOffer.credential_configuration_ids[0];
		}

		// Credential issuer identifier — from payload, issuer_info, credential_offer, or top-level (flow_complete)
		if (payload?.credential_issuer) {
			result.credentialIssuerIdentifier = payload.credential_issuer as string;
		} else if (response.credential_issuer) {
			result.credentialIssuerIdentifier = response.credential_issuer as string;
		} else if (result.issuerInfo?.identifier) {
			result.credentialIssuerIdentifier = result.issuerInfo.identifier;
		} else if (result.credentialOffer?.credential_issuer) {
			result.credentialIssuerIdentifier = result.credentialOffer.credential_issuer;
		}

		// Pre-auth
		if (payload?.pre_authorized_code) {
			result.preAuthorizedCode = payload.pre_authorized_code as string;
		}
		if (payload?.tx_code) {
			result.txCode = payload.tx_code as OID4VCIFlowResult['txCode'];
		}

		// Credential
		if (response?.credential) {
			result.credential = response.credential as string;
		}
		if (response?.format) {
			result.format = response.format as string;
		}
		// Handle credentials array from server
		if (response?.credentials && Array.isArray(response.credentials)) {
				result.credentials = (response.credentials as Array<{format: string; credential: string; vct?: string}>);
		}

		// Deferred
		if (response?.transactionId) {
			result.transactionId = response.transactionId as string;
		}

		return result;
	}

	// ===== OID4VP Flow =====

	async startOID4VPFlow(params: OID4VPFlowParams): Promise<OID4VPFlowResult> {
		if (params.requestUriRef && params.clientId && !params.selectedCredentials) {
			// Phase 1: Start flow with authorization request
			const response = await this.send({
				type: 'flow_start',
				protocol: 'oid4vp',
				request_uri_ref: params.requestUriRef,
				client_id: params.clientId,
			});

			return this.mapOID4VPResponse(response);
		}

		if (params.selectedCredentials) {
			// Cache locally for sign handler
			for (const c of params.selectedCredentials) {
				this.vpCredentialCache.set(c.walletCredentialRef, c.credentialRaw);
			}

			const response = await this.send({
				type: 'flow_action',
				action: 'consent',
				payload: {
					selected_credentials: params.selectedCredentials.map(c => ({
						credential_id: c.walletCredentialRef,
						credential_query_id: c.credentialQueryId,
						disclosed_claims: c.disclosedClaims ?? [],
					})),
				},
			});
			return this.mapOID4VPResponse(response);
		}

		throw new Error('Invalid OID4VP flow params: no valid entry point or continuation');
	}

	private mapOID4VPResponse(response: ServerMessage): OID4VPFlowResult {
		if (response.type === 'error' || response.type === 'flow_error') {
			return {
				success: false,
				error: {
					code: (response.error as { code?: string })?.code ?? 'UNKNOWN_ERROR',
					message: (response.error as { message?: string })?.message ?? 'Unknown error',
				},
			};
		}

		const result: OID4VPFlowResult = {
			success: true,
		};

		const payload = response.payload as Record<string, unknown> | undefined;

		// Credential selection phase (from credential_selection progress)
		if (payload?.dcql_query) {
			result.dcqlQuery = payload.dcql_query as DcqlQuery.Input;
		}
		if (payload?.verifier) {
			result.verifierInfo = mapVerifierInfo(payload.verifier as Record<string, unknown>);
		}

		// Extract purpose from DCQL credential_sets
		const credentialSets = (payload?.dcql_query as any)?.credential_sets;
		if (credentialSets?.[0]?.purpose && result.verifierInfo) {
			result.verifierInfo.purpose = credentialSets[0].purpose;
		}

		// Presentation definition phase
		if (response.presentation_definition) {
			result.presentationDefinition = response.presentation_definition as OID4VPFlowResult['presentationDefinition'];
		}
		if (response.conformant_credentials) {
			// Convert from object to Map if needed
			const creds = response.conformant_credentials;
			if (creds instanceof Map) {
				result.conformantCredentials = creds;
			} else if (typeof creds === 'object') {
				result.conformantCredentials = new Map(Object.entries(creds));
			}
		}
		if (response.verifier_info) {
			result.verifierInfo = mapVerifierInfo(response.verifier_info as Record<string, unknown>);
		}
		if (response.transaction_data) {
			result.transactionData = response.transaction_data as OID4VPFlowResult['transactionData'];
		}

		// Submission result
		if (response.redirect_uri) {
			result.redirectUri = response.redirect_uri as string;
		}
		if (response.response_data) {
			result.responseData = response.response_data;
		}

		return result;
	}

	// ===== Generic Request =====

	async request<T>(flowRequest: OIDFlowRequest): Promise<OIDFlowResponse<T>> {
		try {
			const response = await this.send({
				type: 'generic.request',
				flowType: flowRequest.type,
				action: flowRequest.action,
				payload: flowRequest.payload,
			});

			if (response.type === 'error' || response.type === 'flow_error') {
				return {
					success: false,
					error: {
						code: (response.error as { code?: string })?.code ?? 'UNKNOWN_ERROR',
						message: (response.error as { message?: string })?.message ?? 'Unknown error',
					},
				};
			}

			return {
				success: true,
				data: response.data as T,
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: 'WEBSOCKET_ERROR',
					message: error instanceof Error ? error.message : 'Unknown error',
				},
			};
		}
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

	/**
	 * Register a handler for sign requests from the server.
	 * When the server needs a signature (proof or VP), it sends a sign_request.
	 * The handler should generate the signature and return it.
	 */
	onSignRequest(handler: SignRequestHandler): () => void {
		this.signHandlers.add(handler);
		return () => this.signHandlers.delete(handler);
	}

	/**
	 * Register a handler for credential match requests initiated by the server.
	 * The server sends a match_request containing a presentation definition;
	 * the handler evaluates it against local credentials and returns matching IDs/formats.
	 */
	onMatchRequest(handler: MatchRequestHandler): () => void {
		this.matchHandlers.add(handler);
		return () => this.matchHandlers.delete(handler);
	}

	// ===== Internal Methods =====

	private async handleMessage(message: ServerMessage): Promise<void> {
		// Support both snake_case (backend) and camelCase (legacy)
		const flowId = (message.flow_id as string) || (message.flowId as string);
		const { type } = message;

		// Handle progress events separately
		if (type === 'progress' || type === 'flow_progress') {
			const stage = (message.step as string) || (message.stage as string);
			const payload = message.payload as Record<string, unknown> | undefined;

			// trust integration
			if (
				(stage === 'evaluating_trust' || stage === 'evaluating_verifier_trust') &&
				payload?.trust_evaluation_required
			) {
				await this.handleTrustEvaluationStep(flowId, payload);
			}

			if (
				stage === 'authorization_required' &&
				(payload?.authorization_url || payload?.pre_authorized_code)
			) {
				// Only resolve if user action is needed (redirect or tx_code input)
				const pending = this.pending.get(flowId);
				if (pending) {
					clearTimeout(pending.timeout);
					this.pending.delete(flowId);
					pending.resolve(message);
				}
			}

			if (stage === 'credential_selection') {
				// Resolve pending request to trigger credential selection UI
				const pending = this.pending.get(flowId);
				if (pending) {
					clearTimeout(pending.timeout);
					this.pending.delete(flowId);
					pending.resolve(message);
				}
			}

			this.emitProgress({
				flowId,
				stage,
				progress: message.progress as number | undefined,
				message: message.message as string | undefined,
				payload: message.payload,
			});
			return;
		}

		// Handle sign requests from server
		if (type === 'sign_request') {
			this.handleSignRequest(message);
			return;
		}

		// Handle match requests from server (privacy-preserving credential matching)
		if (type === 'match_request' || type === 'match_credentials') {
			this.handleMatchRequest(message);
			return;
		}

		// All other message types resolve a pending request
		const pending = this.pending.get(flowId);
		if (pending) {
			clearTimeout(pending.timeout);
			this.pending.delete(flowId);

			// Clear flow context on terminal messages
			if (type === 'flow_complete' || type === 'flow_error' || type === 'error') {
				this.currentFlowId = null;
				this.vpCredentialCache.clear();
			}

			// Resolve all non-progress, non-sign_request messages (including error/flow_error)
			// so higher-level callers can uniformly map them into success/error results.
			pending.resolve(message);
		} else {
			logger.warn('Received message for unknown flowId:', flowId);
		}
	}

	/**
	 * Handle trust evaluation
	 */
	private async handleTrustEvaluationStep(flowId: string, payload: Record<string, unknown>): Promise<void> {
		const request = payload.request as {
			subject_id: string;
			subject_type: string;
			key_material?: { type: string; x5c?: string[]; jwk?: unknown };
			context?: Record<string, unknown>;
		} | undefined;

		if (!request?.subject_id) {
			logger.error('[WS Transport] Trust evaluation request missing subject_id');
			this.ws?.send(JSON.stringify({
				type: 'flow_action',
				flow_id: flowId,
				action: 'trust_result',
				timestamp: new Date().toISOString(),
				payload: { trusted: false, reason: 'Missing subject_id' },
			}));
			return;
		}

		try {
			let result: { trusted: boolean; status?: TrustStatusEnum; metadata?: Record<string, unknown> } | null = null;

			switch (request.subject_type) {
				case 'credential_issuer':
					result = await this.trustEvaluators.evaluateIssuerTrust({
						issuerId: request.subject_id,
						keyMaterial: request.key_material ? {
							type: request.key_material.type as 'jwk' | 'x5c',
							key: request.key_material.x5c ?? request.key_material.jwk,
						} : undefined,
						context: request.context,
					});
					break;
				case 'credential_verifier':
					const scheme = (request.context?.client_id_scheme as string) || 'x509_san_dns';
					const clientId = request.subject_id;

					let identifier = clientId;
					if (scheme === 'x509_san_dns' && clientId.startsWith('x509_san_dns:')) {
						identifier = clientId.slice('x509_san_dns:'.length);
					}

					result = await this.trustEvaluators.evaluateVerifierTrust({
						clientIdScheme: {
							scheme: scheme as 'x509_san_dns' | 'did' | 'https' | 'pre-registered',
							clientId,
							identifier,
						},
						keyMaterial: request.key_material
							? {
								type: request.key_material.type as 'jwk' | 'x5c' | 'kid',
								key: request.key_material.x5c ?? request.key_material.jwk
							}
							: {
								type: 'kid' as const,
								key: ''
							},
						responseUri: request.context?.response_uri as string | undefined,
					});
					break;
				default:
					throw new Error(`Unknown subject_type for trust evaluation: ${request.subject_type}`);
			}

			this.sendTrustResult(flowId, {
				trusted: result?.trusted ?? false,
				framework: result?.metadata?.framework as string | undefined,
				reason: result?.metadata?.reason as string | undefined,
			});
		} catch (error) {
			logger.error('[WS Transport] Trust evaluation failed:', error);
			this.sendTrustResult(flowId, { trusted: false, reason: error instanceof Error ? error.message : 'Unknown error' });
		}
	}

	private sendTrustResult(flowId: string, result: { trusted: boolean; framework?: string; reason?: string }): void {
			this.ws?.send(JSON.stringify({
			type: 'flow_action',
			flow_id: flowId,
			action: 'trust_result',
			timestamp: new Date().toISOString(),
			payload: result,
		}));
	}

	/**
	 * Handle a sign request from the server
	 */
	private async handleSignRequest(message: ServerMessage): Promise<void> {
		const flowId = (message.flow_id as string) || (message.flowId as string) || '';
		const rawParams = (message.params as Record<string, unknown>) || {};

		const request: SignRequest = {
			flowId,
			messageId: (message.message_id as string) || (message.messageId as string) || '',
			action: message.action as 'generate_proof' | 'sign_presentation',
			params: {
				audience: rawParams.audience as string | undefined,
				issuer: rawParams.issuer as string | undefined,
				nonce: rawParams.nonce as string | undefined,
				proofType: rawParams.proof_type as string | undefined,
				proofTypesSupported: rawParams.proof_types_supported as SignRequest['params']['proofTypesSupported'],
				count: rawParams.count as number | undefined,
				responseUri: rawParams.response_uri as string | undefined,
				verifierJwkThumbprint: rawParams.verifier_jwk_thumbprint as string | undefined,
				credentialsToInclude: (
					rawParams.credentials_to_include as Array<{
						credential_id: string;
						credential_query_id?: string;
						disclosed_claims?: string[];
					}> | undefined
				)?.map(c => ({
					credentialId: c.credential_id,
					credentialQueryId: c.credential_query_id,
					disclosedClaims: c.disclosed_claims,
					credentialRaw: this.vpCredentialCache.get(c.credential_id),
				})),
			},
		};

		if (this.signHandlers.size === 0) {
			logger.error('No sign handlers registered, cannot respond to sign request');
			this.sendSignResponse(request.flowId, request.messageId, {}, 'No sign handler available');
			return;
		}

		// Call all handlers until one succeeds
		let lastError: Error | null = null;
		for (const handler of this.signHandlers) {
			try {
				const response = await handler(request);
				this.sendSignResponse(request.flowId, request.messageId, response);
				return;
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err));
				logger.warn('Sign handler failed:', lastError.message);
			}
		}

		// All handlers failed
		this.sendSignResponse(
			request.flowId,
			request.messageId,
			{},
			lastError?.message || 'Sign operation failed'
		);
	}

	/**
	 * Send a sign response back to the server
	 */
	private sendSignResponse(
		flowId: string,
		messageId: string,
		response: SignResponse,
		error?: string
	): void {
		if (!this.isConnected()) {
			logger.error('Cannot send sign response: WebSocket not connected');
			return;
		}

		const msg: Record<string, unknown> = {
			type: 'sign_response',
			flow_id: flowId,
			message_id: messageId,
			timestamp: new Date().toISOString(),
		};

		if (error) {
			msg.error = error;
		} else {
			if (response.proofJwt) msg.proof_jwt = response.proofJwt;
			if (response.proofs) msg.proofs = response.proofs;
			if (response.vpToken) msg.vp_token = response.vpToken;
		}

		try {
			this.ws!.send(JSON.stringify(msg));
		} catch (err) {
			logger.error('Failed to send sign response:', err);
		}
	}

	/**
	 * Handle an incoming match_request from the server.
	 * The server initiates client-side credential matching by sending a
	 * presentation definition; the client evaluates it locally and responds
	 * with the matching credential IDs/formats — credentials never leave the device.
	 */
	private async handleMatchRequest(message: ServerMessage): Promise<void> {
		const flowId = (message.flow_id as string) || (message.flowId as string) || '';
		const messageId = (message.message_id as string) || (message.messageId as string) || '';
		const dcqlQuery = message.dcql_query as DcqlQuery.Input | undefined;

		if (!dcqlQuery || typeof dcqlQuery !== 'object') {
			logger.error('Malformed match request: missing required dcql_query');
			this.sendMatchResponse(flowId, messageId, { matches: [] }, 'Missing required dcql_query');
			return;
		}

		const request: MatchRequest = {
			flowId,
			messageId,
			dcqlQuery,
		};

		if (this.matchHandlers.size === 0) {
			logger.error('No match handlers registered, cannot respond to match request');
			this.sendMatchResponse(request.flowId, request.messageId, { matches: [] }, 'No match handler available');
			return;
		}

		// Call all handlers until one succeeds
		let lastError: Error | null = null;
		for (const handler of this.matchHandlers) {
			try {
				const response = await handler(request);
				this.sendMatchResponse(request.flowId, request.messageId, response);
				return;
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err));
				logger.warn('Match handler failed:', lastError.message);
			}
		}

		// All handlers failed
		this.sendMatchResponse(
			request.flowId,
			request.messageId,
			{ matches: [] },
			lastError?.message || 'Credential matching failed'
		);
	}

	/**
	 * Send a match response back to the server
	 */
	private sendMatchResponse(
		flowId: string,
		messageId: string,
		response: MatchResponse,
		error?: string
	): void {
		if (!this.isConnected()) {
			logger.error('Cannot send match response: WebSocket not connected');
			return;
		}

		const msg: Record<string, unknown> = {
			type: 'match_response',
			flow_id: flowId,
			message_id: messageId,
			timestamp: new Date().toISOString(),
		};

		if (error) {
			msg.error = error;
		} else {
			msg.matches = response.matches;
			if (response.no_match_reason) {
				msg.no_match_reason = response.no_match_reason;
			}
		}

		try {
			this.ws.send(JSON.stringify(msg));
		} catch (err) {
			logger.error('Failed to send match response:', err);
		}
	}

	private handleDisconnect(event: CloseEvent): void {
		// Reject all pending requests
		Array.from(this.pending.entries()).forEach(([id, pending]) => {
			clearTimeout(pending.timeout);
			pending.reject(new Error('WebSocket disconnected'));
		});
		this.pending.clear();

		// Reset connection state
		this.ws = null;
		this.connectionPromise = null;
		this.currentFlowId = null;
		this.vpCredentialCache.clear();

		// Don't reconnect if it was a clean close
		if (event.code === 1000) {
			return;
		}

		// Mobile WebViews may suspend networking while app is backgrounded during
		// external OAuth redirects. Avoid consuming reconnect attempts until the app
		// is visible again; foreground logic will trigger reconnect.
		if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
			logger.debug('WebSocket disconnected while app not visible; deferring reconnect attempts');
			return;
		}

		// Attempt reconnect with exponential backoff
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
			this.reconnectAttempts++;

			logger.debug(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

			setTimeout(() => {
				this.connect().catch((error) => {
					logger.error('WebSocket reconnect failed:', error);
					this.emitError(new Error('WebSocket reconnection failed'));
				});
			}, delay);
		} else {
			this.emitError(new Error('WebSocket connection lost after max reconnect attempts'));
		}
	}

	private send(message: Record<string, unknown>): Promise<ServerMessage> {
		return new Promise((resolve, reject) => {
			if (!this.isConnected()) {
				reject(new Error('WebSocket not connected'));
				return;
			}

			const flowId = (message.flow_id as string)
				|| this.currentFlowId
				|| crypto.randomUUID();
			const fullMessage = { ...message, flow_id: flowId };

			if (message.type === 'flow_start') {
				this.currentFlowId = flowId;
			}

			// Set up timeout
			const timeout = setTimeout(() => {
				if (this.pending.has(flowId)) {
					this.pending.delete(flowId);
					reject(new Error('Request timeout'));
				}
			}, this.requestTimeout);

			// Store pending request
			this.pending.set(flowId, { resolve, reject, flowId, timeout });

			// Send message
			try {
				this.ws!.send(JSON.stringify(fullMessage));
			} catch (error) {
				clearTimeout(timeout);
				this.pending.delete(flowId);
				reject(error);
			}
		});
	}

	private emitProgress(event: OIDFlowProgressEvent): void {
		Array.from(this.progressCallbacks).forEach(callback => {
			try {
				callback(event);
			} catch (e) {
				logger.error('Error in progress callback:', e);
			}
		});
	}

	private emitError(error: Error): void {
		Array.from(this.errorCallbacks).forEach(callback => {
			try {
				callback(error);
			} catch (e) {
				logger.error('Error in error callback:', e);
			}
		});
	}

	/**
	 * Update the auth token (e.g., after token refresh)
	 */
	updateAuthToken(token: string, tenantId?: string): void {
		this.authToken = token;
		if (tenantId !== undefined) {
			this.tenantId = tenantId;
		}
	}

	/**
	 * Send a flow action to the server.
	 * Used for responding to server requests during a flow (e.g., credential matching).
	 */
	sendFlowAction(action: FlowAction): void {
		if (!this.isConnected()) {
			logger.error('Cannot send flow action: WebSocket not connected');
			return;
		}

		const msg = {
			type: 'flow_action',
			flow_id: action.flowId,
			action: action.action,
			payload: action.payload,
			timestamp: new Date().toISOString(),
		};

		try {
			this.ws!.send(JSON.stringify(msg));
			logger.debug('[WS Transport] Sent flow action:', action.action);
		} catch (err) {
			logger.error('Failed to send flow action:', err);
		}
	}

	/**
	 * Get the current connection state
	 */
	getConnectionState(): {
		connected: boolean;
		reconnectAttempts: number;
		pendingRequests: number;
	} {
		return {
			connected: this.isConnected(),
			reconnectAttempts: this.reconnectAttempts,
			pendingRequests: this.pending.size,
		};
	}
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Parse a logo value from the backend.
 * Handles both string URLs and object formats with a `uri` field.
 */
function parseLogo(logo: unknown): string | undefined {
	if (logo == null) return undefined;
	if (typeof logo === 'string') return logo;
	if (typeof logo === 'object' && logo !== null) {
		return (logo as Record<string, unknown>).uri as string | undefined;
	}
	return undefined;
}

/**
 * Map a raw verifier info object from the backend into the typed frontend
 * representation. Handles the backend's snake_case `trusted_status` field
 * as well as the legacy `trusted` boolean.
 */
function mapVerifierInfo(raw: Record<string, unknown>): OID4VPVerifierInfo {
	return {
		name: raw.name as string | undefined,
		purpose: raw.purpose as string | undefined,
		trustedStatus: parseTrustStatus(raw.trusted_status, raw.trusted),
		reason: raw.reason as string | undefined,
		metadata: raw.metadata as Record<string, unknown> | undefined,
		domain: raw.domain as string | undefined,
		logo: parseLogo(raw.logo),
		clientIdScheme: raw.client_id_scheme as string | undefined,
		trustFramework: raw.framework as string | undefined,
	};
}

/**
 * Map a raw issuer info object from the backend into the typed frontend
 * representation. Handles the backend's snake_case `trusted_status` field
 * as well as the legacy `trusted` boolean.
 *
 * Returns undefined for identifier if the backend doesn't provide a valid string,
 * rather than defaulting to empty string which could mask wire-format issues.
 */
function mapIssuerInfo(raw: Record<string, unknown>): OID4VCIIssuerInfo {
	return {
		identifier: typeof raw.identifier === 'string' ? raw.identifier : undefined,
		name: raw.name as string | undefined,
		logo: parseLogo(raw.logo),
		trustedStatus: parseTrustStatus(raw.trusted_status, raw.trusted),
		reason: raw.reason as string | undefined,
		metadata: raw.metadata as Record<string, unknown> | undefined,
	};
}

/**
 * Parse a trust status value from the backend.
 *
 * Supports:
 * - New wire format: `trusted_status` string ("trusted"|"unknown"|"untrusted")
 * - Legacy wire format: `trusted` boolean → maps true→"trusted", false→"untrusted"
 * - Missing/null → "unknown"
 */
function parseTrustStatus(
	trustedStatus: unknown,
	legacyTrusted?: unknown,
): TrustStatus {
	// New format: string tri-state
	if (typeof trustedStatus === 'string') {
		if (trustedStatus === 'trusted' || trustedStatus === 'untrusted' || trustedStatus === 'unknown') {
			return trustedStatus;
		}
	}
	// Legacy format: boolean
	if (typeof legacyTrusted === 'boolean') {
		return legacyTrusted ? 'trusted' : 'untrusted';
	}
	return 'unknown';
}
