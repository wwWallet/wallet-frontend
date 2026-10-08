import * as oauth4webapi from 'oauth4webapi';
import { useHttpProxy } from "../../HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import { OpenidAuthorizationServerMetadata } from "wallet-common";
import { MODE } from '@/config';
import * as jose from 'jose';
import { useWalletProvider } from '../../WalletProvider';
import type { DpopState } from './accessToken';
import SessionContext from '@/context/SessionContext';
import { AttestationBasedClientAuth } from './AttestationBasedClientAuth';

const { customFetch, allowInsecureRequests } = oauth4webapi;
const isDev = MODE === 'development';

function normalizeHeaders(h: any): Record<string, string> {
	const out: Record<string, string> = {};
	if (!h) return out;
	for (const [k, v] of Object.entries(h)) {
		if (v === undefined || v === null) continue;
		out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v);
	}
	return out;
}

export function usePushedAuthorizationRequest() {
	const httpProxy = useHttpProxy();
	const { keystore, api: { updatePrivateData } } = useContext(SessionContext);
	const { requestWalletInstanceAttestation } = useWalletProvider();

	const myCustomFetch = useMemo(() => {
		return async (url: string, options?: RequestInit) => {
			const method = (options?.method ?? 'POST').toLowerCase();
			const headers = normalizeHeaders(options?.headers);
			const body = options?.body;

			let data: string | undefined;
			if (typeof body === 'string') {
				data = body;
			} else if (body instanceof URLSearchParams) {
				data = body.toString();
			} else if (body != null) {
				data = String(body);
			}

			let wrapped;
			if (method === 'post') {
				wrapped = await httpProxy.post(url, data, headers);
			} else {
				throw new Error(`Unsupported method in customFetch: ${method}`);
			}

			// wrapped = { status, headers, data } where `data` is the real AS response body
			const resHeaders = normalizeHeaders(wrapped.headers);
			const contentType = resHeaders['content-type'] ?? 'application/json';
			const bodyText =
				typeof wrapped.data === 'string'
					? wrapped.data
					: contentType.includes('application/json')
						? JSON.stringify(wrapped.data)
						: String(wrapped.data ?? '');

			return new Response(bodyText, {
				status: wrapped.status ?? 500,
				headers: resHeaders,
			});
		};
	}, [httpProxy]);

	const sendPushedAuthorizationRequest = useCallback(
		async (asMeta: OpenidAuthorizationServerMetadata, params: Record<string,string>) => {
			const endpoint = asMeta.pushed_authorization_request_endpoint;
			if (!endpoint) {
				throw new Error('AS metadata missing pushed_authorization_request_endpoint');
			}
			const client: oauth4webapi.Client = { client_id: params.client_id };
			let dpop: DpopState | undefined;
			let walletInstanceAttestation: string | undefined;

			if (asMeta.token_endpoint_auth_methods_supported?.includes('attest_jwt_client_auth')) {
				const [{ keypairs }, newPrivateData, keystoreCommit] = await keystore.generateKeypairs(1);
				await updatePrivateData(newPrivateData);
				await keystoreCommit();
				const { privateKey: privateJwk, publicKey: generatedPublicJwk, alg } = keypairs[0];
				const publicJwk = { ...generatedPublicJwk, key_ops: ['verify'] };

				const requestWalletInstanceAttestationResponse = await requestWalletInstanceAttestation(publicJwk, params.client_id, asMeta.issuer);
				if (!requestWalletInstanceAttestationResponse) {
					throw new Error('Failed to get Wallet Instance Attestation from wallet-backend-server');
				}
				walletInstanceAttestation = requestWalletInstanceAttestationResponse.wallet_instance_attestation;
				params.dpop_jkt = await jose.calculateJwkThumbprint(publicJwk);
				dpop = {
					dpopAlg: alg,
					dpopJti: crypto.randomUUID(),
					dpopPrivateKeyJwk: privateJwk,
					dpopPublicKeyJwk: publicJwk,
				};
			}

			// Generate PKCE
			const code_verifier = oauth4webapi.generateRandomCodeVerifier();
			const code_challenge = await oauth4webapi.calculatePKCECodeChallenge(code_verifier);
			params.code_challenge = code_challenge;
			params.code_challenge_method = "S256";

			const body = new URLSearchParams(params);

			const as: oauth4webapi.AuthorizationServer = {
				issuer: asMeta.issuer,
				pushed_authorization_request_endpoint: endpoint,
			};

			const privateKey = dpop
				? await jose.importJWK(dpop.dpopPrivateKeyJwk, dpop.dpopAlg) as CryptoKey
				: undefined;
			const sendPar = (challenge?: string) => oauth4webapi.pushedAuthorizationRequest(
				as,
				client,
				privateKey && walletInstanceAttestation
					? AttestationBasedClientAuth(privateKey, walletInstanceAttestation, { challenge })
					: oauth4webapi.None(),
				body,
				{
					[customFetch]: myCustomFetch,
					[allowInsecureRequests]: isDev,
				}
			);

			let response = await sendPar();
			let json = await response.json();
			const challenge = response.headers.get('OAuth-Client-Attestation-Challenge');
			if (privateKey && walletInstanceAttestation && response.status === 400 && json?.error === 'use_attestation_challenge' && challenge) {
				response = await sendPar(challenge);
				json = await response.json();
			}
			if (json?.error) {
				throw new Error(`PAR failed: ${json.error} ${json.error_description ?? ''}`.trim());
			}
			if (!json?.request_uri) {
				throw new Error(`PAR failed: missing request_uri. Got: ${JSON.stringify(json)}`);
			}
			return { request_uri: json.request_uri, code_verifier, rawResponse: json, dpop, walletInstanceAttestation };
		},
		[myCustomFetch, requestWalletInstanceAttestation, keystore, updatePrivateData]
	);

	return useMemo(() => ({ sendPushedAuthorizationRequest }), [sendPushedAuthorizationRequest]);
}
