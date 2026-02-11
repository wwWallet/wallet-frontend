import * as oauth4webapi from 'oauth4webapi';
import { useHttpProxy } from "../../HttpProxy/HttpProxy";
import { useCallback, useMemo } from "react";
import { OpenidAuthorizationServerMetadata } from "wallet-common";
import { MODE } from '@/config';

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

			const response = await oauth4webapi.pushedAuthorizationRequest(
				as,
				client,
				oauth4webapi.None(),
				body,
				{
					[customFetch]: myCustomFetch,
					[allowInsecureRequests]: isDev,
				}
			);

			const json = await response.json();
			if (json?.error) {
				throw new Error(`PAR failed: ${json.error} ${json.error_description ?? ''}`.trim());
			}
			if (!json?.request_uri) {
				throw new Error(`PAR failed: missing request_uri. Got: ${JSON.stringify(json)}`);
			}
			return { request_uri: json.request_uri, code_verifier, rawResponse: json };
		},
		[myCustomFetch]
	);

	return useMemo(() => ({ sendPushedAuthorizationRequest }), [sendPushedAuthorizationRequest]);
}
