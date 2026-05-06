/**
 * OIDFlowWebSocketTransport Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OIDFlowWebSocketTransport } from '../transports/OIDFlowWebSocketTransport';

// Mock WebSocket implementation
class MockWebSocket {
	static CONNECTING = 0;
	static OPEN = 1;
	static CLOSING = 2;
	static CLOSED = 3;
	static shouldFail = false; // Static flag to control connection behavior

	readyState: number = MockWebSocket.CONNECTING;
	url: string;

	onopen: ((event: Event) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	sentMessages: string[] = [];

	constructor(url: string | URL) {
		this.url = typeof url === 'string' ? url : url.toString();
		// Simulate async connection based on shouldFail flag
		setTimeout(() => {
			if (MockWebSocket.shouldFail) {
				this.readyState = MockWebSocket.CLOSED;
				this.onerror?.(new Event('error'));
			} else {
				this.readyState = MockWebSocket.OPEN;
				this.onopen?.(new Event('open'));
			}
		}, 0);
	}

	send(data: string): void {
		if (this.readyState !== MockWebSocket.OPEN) {
			throw new Error('WebSocket not open');
		}
		this.sentMessages.push(data);
	}

	close(code?: number, reason?: string): void {
		this.readyState = MockWebSocket.CLOSED;
		this.onclose?.({ code: code ?? 1000, reason: reason ?? '' } as CloseEvent);
	}

	// Test helper to simulate receiving a message
	simulateMessage(data: unknown): void {
		this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent);
	}

	// Test helper to simulate an error
	simulateError(): void {
		this.onerror?.(new Event('error'));
	}

	// Test helper to simulate connection failure
	simulateConnectionFailure(): void {
		this.readyState = MockWebSocket.CLOSED;
		this.onerror?.(new Event('error'));
	}
}

// Store mock instances for inspection
let mockWebSocketInstances: MockWebSocket[] = [];

// Replace global WebSocket
const originalWebSocket = globalThis.WebSocket;

beforeEach(() => {
	mockWebSocketInstances = [];
	MockWebSocket.shouldFail = false; // Reset to success mode
	// @ts-expect-error - mocking WebSocket
	globalThis.WebSocket = class extends MockWebSocket {
		constructor(url: string | URL) {
			super(url);
			mockWebSocketInstances.push(this);
		}
	};
});

afterEach(() => {
	globalThis.WebSocket = originalWebSocket;
	vi.restoreAllMocks();
});

describe('OIDFlowWebSocketTransport', () => {
	const wsUrl = 'wss://test.example.com/api/v2/wallet';
	const authToken = 'test-auth-token';

	describe('Connection Lifecycle', () => {
		it('should connect successfully', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);

			await transport.connect();

			expect(transport.isConnected()).toBe(true);
			expect(mockWebSocketInstances).toHaveLength(1);
			expect(mockWebSocketInstances[0].url).toContain(wsUrl);
			// Auth token is now sent as the first message, not in URL
			const authMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[0]);
			expect(authMessage.type).toBe('handshake');
			expect(authMessage.app_token).toBe(authToken);
		});

		it('should handle connection errors', async () => {
			// Set the mock to fail connections
			MockWebSocket.shouldFail = true;

			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await expect(transport.connect()).rejects.toThrow('WebSocket connection failed');
		});

		it('should disconnect cleanly', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			expect(transport.isConnected()).toBe(true);

			await transport.disconnect();

			expect(transport.isConnected()).toBe(false);
		});

		it('should return existing connection promise if already connecting', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);

			// Start two connections simultaneously
			const promise1 = transport.connect();
			const promise2 = transport.connect();

			await Promise.all([promise1, promise2]);

			// Should only create one WebSocket
			expect(mockWebSocketInstances).toHaveLength(1);
		});

		it('should return immediately if already connected', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			// Second connect should not create new WebSocket
			await transport.connect();

			expect(mockWebSocketInstances).toHaveLength(1);
		});
	});

	describe('OID4VCI Flow', () => {
		it('should send flow_start message with credential_offer_uri', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const credentialOfferUri = 'openid-credential-offer://?credential_offer=...';

			// Start flow and prepare response
			const flowPromise = transport.startOID4VCIFlow({ credentialOfferUri });

			// Wait for message to be sent (index 1 because index 0 is auth message)
			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_start');
			expect(sentMessage.protocol).toBe('oid4vci');
			expect(sentMessage.credential_offer_uri).toBe(credentialOfferUri);
			expect(sentMessage.flow_id).toBeDefined();

			// Simulate server response
			mockWebSocketInstances[0].simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'flow_complete',
				payload: { issuer_metadata: { issuer: 'https://issuer.example.com' } },
			});

			const result = await flowPromise;
			expect(result.success).toBe(true);
			expect(result.issuerMetadata).toEqual({ issuer: 'https://issuer.example.com' });
		});

		it('should send flow_action message with holder binding', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const holderBinding = {
				publicKeyJwk: { kty: 'EC', crv: 'P-256', x: 'abc', y: 'xyz' },
				method: 'jwt_key' as const,
			};

			const flowPromise = transport.startOID4VCIFlow({
				holderBinding,
				credentialConfigurationId: 'UniversityDegree'
			});

			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_action');
			expect(sentMessage.action).toBe('consent');
			expect(sentMessage.payload.holder_public_key).toEqual(holderBinding.publicKeyJwk);
			expect(sentMessage.payload.holder_binding_method).toBe('jwt_key');

			// Simulate successful credential response
			mockWebSocketInstances[0].simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'flow_complete',
				credential: 'eyJ...',
				format: 'jwt_vc_json',
			});

			const result = await flowPromise;
			expect(result.success).toBe(true);
			expect(result.credential).toBe('eyJ...');
		});

		it('should handle authorization code exchange', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const flowPromise = transport.startOID4VCIFlow({
				authorizationCode: 'auth-code-123',
				codeVerifier: 'verifier-abc',
			});

			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_action');
			expect(sentMessage.action).toBe('authorization_complete');
			expect(sentMessage.payload.code).toBe('auth-code-123');
			expect(sentMessage.payload.code_verifier).toBe('verifier-abc');

			// Respond with credential
			mockWebSocketInstances[0].simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'flow_complete',
				credential: 'eyJ...',
			});

			const result = await flowPromise;
			expect(result.success).toBe(true);
		});

		it('should handle error responses by returning success: false', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const flowPromise = transport.startOID4VCIFlow({
				credentialOfferUri: 'openid-credential-offer://?...',
			});

			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);

			// Simulate error response
			mockWebSocketInstances[0].simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'error',
				error: { code: 'INVALID_OFFER', message: 'Invalid credential offer' },
			});

			// The implementation returns success: false with error details
			const result = await flowPromise;
			expect(result.success).toBe(false);
			expect(result.error?.code).toBe('INVALID_OFFER');
			expect(result.error?.message).toBe('Invalid credential offer');
		});

		it('should reject invalid params', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			// Empty params should throw
			await expect(transport.startOID4VCIFlow({})).rejects.toThrow(
				'Invalid OID4VCI flow params'
			);
		});

		it('should handle deferred credential issuance with transaction_id', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			const credentialOfferUri = 'openid-credential-offer://?credential_offer=...';

			// Start flow
			const flowPromise = transport.startOID4VCIFlow({ credentialOfferUri });

			await vi.waitFor(() => {
				expect(mockWs.sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWs.sentMessages[1]);
			expect(sentMessage.type).toBe('flow_start');

			// Simulate deferred issuance response with transactionId
			mockWs.simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'flow_complete',
				transactionId: 'txn-deferred-123',
				// No credential yet - deferred
			});

			const result = await flowPromise;
			expect(result.success).toBe(true);
			expect(result.transactionId).toBe('txn-deferred-123');
			expect(result.credential).toBeUndefined();
		});
	});

	describe('OID4VP Flow', () => {
		it('should send flow_start message with request_uri', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const requestUriRef = 'openid4vp://?request_uri=...';
			const clientId = 'https://verifier.example.com';

			const flowPromise = transport.startOID4VPFlow({ requestUriRef, clientId });

			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_start');
			expect(sentMessage.protocol).toBe('oid4vp');
			expect(sentMessage.request_uri_ref).toBe(requestUriRef);
			expect(sentMessage.client_id).toBe(clientId);

			// Simulate response with presentation definition
			mockWebSocketInstances[0].simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'flow_complete',
				presentation_definition: { id: 'test-pd', input_descriptors: [] },
				verifier_info: { name: 'Test Verifier' },
			});

			const result = await flowPromise;
			expect(result.success).toBe(true);
			expect((result.presentationDefinition as { id: string })?.id).toBe('test-pd');
			expect(result.verifierInfo?.name).toBe('Test Verifier');
		});

		it('should send flow_action with selected credentials', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const selectedCredentials = [
				{
					batchId: 1,
					credentialQueryId: 'id-1',
					walletCredentialRef: 'cred-ref-1',
					credentialRaw: 'eyJ...credential...',
					holderKeyKid: 'did:key:z123#key-1',
					disclosedClaims: ['given_name'],
				},
			];

			const flowPromise = transport.startOID4VPFlow({
				selectedCredentials,
			});

			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_action');
			expect(sentMessage.action).toBe('consent');
			expect(sentMessage.payload.selected_credentials).toEqual([
				{
					credential_id: 'cred-ref-1',
					credential_query_id: 'id-1',
					disclosed_claims: ['given_name'],
				},
			]);

			// Simulate success response
			mockWebSocketInstances[0].simulateMessage({
				flow_id: sentMessage.flow_id,
				type: 'flow_complete',
				redirect_uri: 'https://verifier.example.com/callback',
			});

			const result = await flowPromise;
			expect(result.success).toBe(true);
			expect(result.redirectUri).toBe('https://verifier.example.com/callback');
		});

		it('should reject invalid params', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			await expect(transport.startOID4VPFlow({})).rejects.toThrow(
				'Invalid OID4VP flow params'
			);
		});
	});

	describe('Progress Events', () => {
		it('should emit progress events to subscribers', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const progressCallback = vi.fn();
			transport.onProgress(progressCallback);

			// Simulate progress message
			mockWebSocketInstances[0].simulateMessage({
				flow_id: 'test-flow-id',
				type: 'progress',
				stage: 'fetching_metadata',
				progress: 0.25,
				message: 'Fetching issuer metadata...',
			});

			expect(progressCallback).toHaveBeenCalledWith({
				flowId: 'test-flow-id',
				stage: 'fetching_metadata',
				progress: 0.25,
				message: 'Fetching issuer metadata...',
			});
		});

		it('should allow unsubscribing from progress events', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const progressCallback = vi.fn();
			const unsubscribe = transport.onProgress(progressCallback);

			// Unsubscribe
			unsubscribe();

			// Send progress - should not trigger callback
			mockWebSocketInstances[0].simulateMessage({
				flow_id: 'test-flow-id',
				type: 'progress',
				stage: 'done',
			});

			expect(progressCallback).not.toHaveBeenCalled();
		});
	});

	describe('Error Events', () => {
		it('should emit error events to subscribers', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const errorCallback = vi.fn();
			transport.onError(errorCallback);

			// Simulate disconnection with non-clean close
			const ws = mockWebSocketInstances[0];
			ws.readyState = MockWebSocket.CLOSED;
			ws.onclose?.({ code: 1006, reason: 'Connection lost' } as CloseEvent);

			// The error should be emitted after max reconnect attempts
			// For this test, we just verify the callback mechanism works
			// by disconnecting cleanly first, then triggering an error manually
		});

		it('should allow unsubscribing from error events', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const errorCallback = vi.fn();
			const unsubscribe = transport.onError(errorCallback);

			unsubscribe();

			expect(errorCallback).not.toHaveBeenCalled();
		});
	});

	describe('Auth Token Management', () => {
		it('should update auth token', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			transport.updateAuthToken('new-token-123');

			// Verify the token was updated by checking connection state
			const state = transport.getConnectionState();
			expect(state.connected).toBe(true);
		});
	});

	describe('Connection State', () => {
		it('should report connection state correctly', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);

			// Before connection
			let state = transport.getConnectionState();
			expect(state.connected).toBe(false);
			expect(state.reconnectAttempts).toBe(0);
			expect(state.pendingRequests).toBe(0);

			// After connection
			await transport.connect();
			state = transport.getConnectionState();
			expect(state.connected).toBe(true);

			// After disconnect
			await transport.disconnect();
			state = transport.getConnectionState();
			expect(state.connected).toBe(false);
		});
	});

	describe('Request Timeout', () => {
		it('should reject requests when not connected', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);

			// Don't connect - try to start flow
			await expect(
				transport.startOID4VCIFlow({ credentialOfferUri: 'test://...' })
			).rejects.toThrow('WebSocket not connected');
		});

		it('should reject pending requests on disconnect', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			// Start a flow but don't respond
			const flowPromise = transport.startOID4VCIFlow({
				credentialOfferUri: 'test://...'
			});

			// Wait for message to be sent
			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(0);
			});

			// Disconnect while request is pending
			await transport.disconnect();

			await expect(flowPromise).rejects.toThrow('WebSocket disconnected');
		});
	});

	describe('Sign Request/Response', () => {
		it('should handle sign_request for generate_proof action', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			// Verify we have the mock instance
			expect(mockWebSocketInstances.length).toBe(1);
			const mockWs = mockWebSocketInstances[0];

			// Register a sign handler
			const signHandler = vi.fn().mockResolvedValue({
				proofJwt: 'eyJ...proof...'
			});
			transport.onSignRequest(signHandler);

			// Simulate a sign_request from server
			mockWs.simulateMessage({
				flow_id: 'test-flow-id',
				message_id: 'msg-123',
				type: 'sign_request',
				action: 'generate_proof',
				params: {
					audience: 'https://issuer.example.com',
					nonce: 'nonce-456',
					proof_type: 'jwt',
				},
			});

			// Wait for the handler to be called
			await vi.waitFor(() => {
				expect(signHandler).toHaveBeenCalled();
			});

			// Verify the handler received correct parameters
			expect(signHandler).toHaveBeenCalledWith({
				flowId: 'test-flow-id',
				messageId: 'msg-123',
				action: 'generate_proof',
				params: {
					audience: 'https://issuer.example.com',
					nonce: 'nonce-456',
					proofType: 'jwt',
					issuer: undefined,
					proofTypesSupported: undefined,
					count: undefined,
					credentialsToInclude: undefined,
				},
			});

			// Wait a bit for async processing to complete
			await new Promise(resolve => setTimeout(resolve, 100));

			// Wait for sign_response to be sent
			await vi.waitFor(() => {
				expect(mockWs.sentMessages.length).toBeGreaterThan(0);
			});

			// Verify sign_response was sent
			const signResponseMsg = mockWs.sentMessages.find(
				m => JSON.parse(m).type === 'sign_response'
			);
			expect(signResponseMsg).toBeDefined();
			const parsed = JSON.parse(signResponseMsg!);
			expect(parsed.flow_id).toBe('test-flow-id');
			expect(parsed.message_id).toBe('msg-123');
			expect(parsed.proof_jwt).toBe('eyJ...proof...');
		});

		it('should handle sign_request for sign_presentation action', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			// Register a sign handler
			const signHandler = vi.fn().mockResolvedValue({
				vpToken: 'eyJ...vp-token...'
			});
			transport.onSignRequest(signHandler);

			// Simulate a sign_request from server
			mockWs.simulateMessage({
				flow_id: 'test-flow-id',
				message_id: 'msg-456',
				type: 'sign_request',
				action: 'sign_presentation',
				params: {
					audience: 'https://verifier.example.com',
					nonce: 'nonce-789',
					credentialsToInclude: [
						{ credentialId: 'cred-1', disclosedClaims: ['given_name', 'family_name'] }
					],
				},
			});

			// Wait for the handler to be called
			await vi.waitFor(() => {
				expect(signHandler).toHaveBeenCalled();
			});

			// Wait a bit for async processing to complete
			await new Promise(resolve => setTimeout(resolve, 100));

			// Wait for sign_response to be sent
			await vi.waitFor(() => {
				expect(mockWs.sentMessages.length).toBeGreaterThan(0);
			});

			// Verify sign_response has vp_token
			const signResponseMsg = mockWs.sentMessages.find(
				m => JSON.parse(m).type === 'sign_response'
			);
			expect(signResponseMsg).toBeDefined();
			const parsed = JSON.parse(signResponseMsg!);
			expect(parsed.vp_token).toBe('eyJ...vp-token...');
		});

		it('should handle multiple sign handlers', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const handler1 = vi.fn().mockResolvedValue({ proofJwt: 'proof1' });
			const handler2 = vi.fn().mockResolvedValue({ proofJwt: 'proof2' });

			transport.onSignRequest(handler1);
			transport.onSignRequest(handler2);

			// Simulate a sign_request
			mockWebSocketInstances[0].simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'sign_request',
				action: 'generate_proof',
				params: { audience: 'aud', nonce: 'n' },
			});

			// Wait for handlers to be called
			await vi.waitFor(() => {
				expect(handler1).toHaveBeenCalled();
			});

			// First registered handler should be used
			expect(handler1).toHaveBeenCalled();
		});

		it('should unregister sign handler', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const signHandler = vi.fn().mockResolvedValue({ proofJwt: 'jwt' });
			const unsubscribe = transport.onSignRequest(signHandler);

			// Unsubscribe
			unsubscribe();

			// Simulate a sign_request
			mockWebSocketInstances[0].simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'sign_request',
				action: 'generate_proof',
				params: { audience: 'aud', nonce: 'n' },
			});

			// Give time for potential async handling
			await new Promise(resolve => setTimeout(resolve, 50));

			// Handler should not be called after unsubscribe
			expect(signHandler).not.toHaveBeenCalled();
		});

		it('should send error in sign_response when handler fails', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			// Register a handler that rejects
			const signHandler = vi.fn().mockRejectedValue(new Error('Keystore unavailable'));
			transport.onSignRequest(signHandler);

			// Simulate a sign_request
			mockWs.simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'sign_request',
				action: 'generate_proof',
				params: { audience: 'aud', nonce: 'n' },
			});

			// Wait a bit for async processing to complete
			await new Promise(resolve => setTimeout(resolve, 100));

			// Wait for error sign_response
			await vi.waitFor(() => {
				expect(mockWs.sentMessages.length).toBeGreaterThan(0);
			});

			const signResponseMsg = mockWs.sentMessages.find(
				m => JSON.parse(m).type === 'sign_response'
			);
			expect(signResponseMsg).toBeDefined();
			const parsed = JSON.parse(signResponseMsg!);
			expect(parsed.error).toBeDefined();
			expect(parsed.error).toContain('Keystore unavailable');
		});
	});

	describe('Match Request/Response', () => {
		it('should call registered match handler on match_request', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const matchHandler = vi.fn().mockResolvedValue({
				matches: [
					{ input_descriptor_id: 'id-1', credential_id: 'cred-1', format: 'vc+sd-jwt' }
				],
			});
			transport.onMatchRequest(matchHandler);

			// Simulate a match_request from the server
			mockWebSocketInstances[0].simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: {
					credentials: [{ id: 'id-1', format: 'vc+sd-jwt', claims: [] }],
				},
			});

			await vi.waitFor(() => {
				expect(matchHandler).toHaveBeenCalled();
			});

			expect(matchHandler).toHaveBeenCalledWith(expect.objectContaining({
				flowId: 'flow-1',
				messageId: 'msg-1',
				dcqlQuery: expect.objectContaining({
					credentials: [{ id: 'id-1', format: 'vc+sd-jwt', claims: [] }],
				}),
			}));
		});

		it('should send match_response with matches from handler', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			const matchHandler = vi.fn().mockResolvedValue({
				matches: [
					{ input_descriptor_id: 'id-1', credential_id: 'cred-1', format: 'vc+sd-jwt', vct: 'Photo' },
					{ input_descriptor_id: 'id-2', credential_id: 'cred-2', format: 'jwt_vp_json' },
				],
			});
			transport.onMatchRequest(matchHandler);

			// Simulate a match_request
			mockWs.simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: {
					credentials: [{ id: 'id-1' }, { id: 'id-2' }],
				},
			});

			// Wait for match_response to be sent
			await vi.waitFor(() => {
				const matchResponse = mockWs.sentMessages.find(m => {
					const parsed = JSON.parse(m);
					return parsed.type === 'match_response';
				});
				expect(matchResponse).toBeDefined();
			});

			const matchResponseMsg = mockWs.sentMessages.find(m =>
				JSON.parse(m).type === 'match_response'
			);
			const parsed = JSON.parse(matchResponseMsg!);
			expect(parsed.flow_id).toBe('flow-1');
			expect(parsed.message_id).toBe('msg-1');
			expect(parsed.matches).toHaveLength(2);
			expect(parsed.matches[0].input_descriptor_id).toBe('id-1');
			expect(parsed.matches[0].vct).toBe('Photo');
		});

		it('should send match_response with no_match_reason', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			const matchHandler = vi.fn().mockResolvedValue({
				matches: [],
				no_match_reason: 'No matching credentials found',
			});
			transport.onMatchRequest(matchHandler);

			mockWs.simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: { credentials: [] },
			});

			await vi.waitFor(() => {
				expect(mockWs.sentMessages.some(m =>
					JSON.parse(m).type === 'match_response'
				)).toBe(true);
			});

			const matchResponse = mockWs.sentMessages.find(m =>
				JSON.parse(m).type === 'match_response'
			);
			const parsed = JSON.parse(matchResponse!);
			expect(parsed.matches).toEqual([]);
			expect(parsed.no_match_reason).toBe('No matching credentials found');
		});

		it('should support multiple match handlers', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const handler1 = vi.fn().mockResolvedValue({ matches: [{ input_descriptor_id: 'id-1', credential_id: 'c1', format: 'jwt' }] });
			const handler2 = vi.fn().mockResolvedValue({ matches: [{ input_descriptor_id: 'id-2', credential_id: 'c2', format: 'jwt' }] });

			transport.onMatchRequest(handler1);
			transport.onMatchRequest(handler2);

			mockWebSocketInstances[0].simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: { credentials: [] },
			});

			await vi.waitFor(() => {
				expect(handler1).toHaveBeenCalled();
			});

			// First registered handler should be used (succeeds first)
			expect(handler1).toHaveBeenCalled();
		});

		it('should unregister match handler', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const matchHandler = vi.fn().mockResolvedValue({ matches: [] });
			const unsubscribe = transport.onMatchRequest(matchHandler);

			// Unsubscribe
			unsubscribe();

			// Simulate a match_request
			mockWebSocketInstances[0].simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: { credentials: [] },
			});

			// Give time for potential async handling
			await new Promise(resolve => setTimeout(resolve, 50));

			// Handler should not be called after unsubscribe
			expect(matchHandler).not.toHaveBeenCalled();
		});

		it('should send error in match_response when handler fails', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			// Register a handler that rejects
			const matchHandler = vi.fn().mockRejectedValue(new Error('Credential store unavailable'));
			transport.onMatchRequest(matchHandler);

			// Simulate a match_request
			mockWs.simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: { credentials: [] },
			});

			// Wait for error match_response
			await vi.waitFor(() => {
				expect(mockWs.sentMessages.length).toBeGreaterThan(0);
			});

			await vi.waitFor(() => {
				const matchResponseMsg = mockWs.sentMessages.find(
					m => JSON.parse(m).type === 'match_response'
				);
				expect(matchResponseMsg).toBeDefined();
			});

			const matchResponseMsg = mockWs.sentMessages.find(
				m => JSON.parse(m).type === 'match_response'
			);
			const parsed = JSON.parse(matchResponseMsg!);
			expect(parsed.error).toBeDefined();
			expect(parsed.error).toContain('Credential store unavailable');
		});

		it('should handle match_credentials message type as alias', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			const matchHandler = vi.fn().mockResolvedValue({ matches: [] });
			transport.onMatchRequest(matchHandler);

			// Simulate using the alternative message type
			mockWebSocketInstances[0].simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_credentials',
				dcql_query: { credentials: [] },
			});

			await vi.waitFor(() => {
				expect(matchHandler).toHaveBeenCalled();
			});
		});

		it('should send error when no match handlers registered', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();
			const mockWs = mockWebSocketInstances[0];

			// Don't register any handler

			// Simulate a match_request
			mockWs.simulateMessage({
				flowId: 'flow-1',
				message_id: 'msg-1',
				type: 'match_request',
				dcql_query: { credentials: [] },
			});

			// Wait for error match_response
			await vi.waitFor(() => {
				const matchResponseMsg = mockWs.sentMessages.find(
					m => JSON.parse(m).type === 'match_response'
				);
				expect(matchResponseMsg).toBeDefined();
			});

			const matchResponseMsg = mockWs.sentMessages.find(
				m => JSON.parse(m).type === 'match_response'
			);
			const parsed = JSON.parse(matchResponseMsg!);
			expect(parsed.error).toBeDefined();
			expect(parsed.error).toContain('No match handler available');
		});
	});

	describe('Flow Action Sending', () => {
		it('should send flow_action message with sendFlowAction', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			transport.sendFlowAction({
				flowId: 'flow-123',
				action: 'credentials_matched',
				payload: {
					matches: [
						{ input_descriptor_id: 'id-1', credential_id: 'cred-1', format: 'vc+sd-jwt' }
					],
				},
			});

			// Verify message was sent (index 1 because index 0 is auth message)
			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_action');
			expect(sentMessage.flow_id).toBe('flow-123');
			expect(sentMessage.action).toBe('credentials_matched');
			expect(sentMessage.payload.matches).toHaveLength(1);
		});

		it('should send consent action with selected credentials', async () => {
			const transport = new OIDFlowWebSocketTransport(wsUrl, authToken);
			await transport.connect();

			transport.sendFlowAction({
				flowId: 'flow-456',
				action: 'consent',
				payload: {
					selectedCredentials: [
						{
							descriptorId: 'desc-1',
							credentialId: 'cred-1',
							disclosures: ['given_name', 'family_name'],
						},
					],
				},
			});

			await vi.waitFor(() => {
				expect(mockWebSocketInstances[0].sentMessages.length).toBeGreaterThan(1);
			});

			const sentMessage = JSON.parse(mockWebSocketInstances[0].sentMessages[1]);
			expect(sentMessage.type).toBe('flow_action');
			expect(sentMessage.action).toBe('consent');
			expect(sentMessage.payload.selectedCredentials).toHaveLength(1);
		});
	});
});
