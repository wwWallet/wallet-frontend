import * as jose from 'jose';
import {
	OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_PRIVATE_JWK,
	OPENID4VCI_CLIENT_ATTESTATION_ENABLED,
	OPENID4VCI_CLIENT_ATTESTATION_ISSUER,
	OPENID4VCI_CLIENT_ATTESTATION_LIFETIME_SECONDS,
} from '@/config';
import type { OpenidAuthorizationServerMetadata } from 'wallet-common';

type AuthorizationServerMetadataWithChallenge = OpenidAuthorizationServerMetadata & {
	challenge_endpoint?: string;
};

type HttpProxyLike = {
	get(url: string, headers?: Record<string, string>, options?: { useCache?: boolean; cacheOnError?: boolean }): Promise<{
		status: number;
		headers: Record<string, unknown>;
		data: unknown;
	}>;
	post(url: string, body: unknown, headers: Record<string, string>): Promise<{
		status: number;
		headers: Record<string, unknown>;
		data: unknown;
	}>;
};

type ClientInstance = {
	privateKey: jose.KeyLike;
	publicJwk: jose.JWK;
};

type AttestationHeaderOptions = {
	challenge?: string;
};

const clientInstances = new Map<string, Promise<ClientInstance>>();

function getChallengeEndpoint(asMeta: AuthorizationServerMetadataWithChallenge): string {
	const challengeEndpoint = asMeta.challenge_endpoint ?? asMeta.authorization_challenge_endpoint;
	if (challengeEndpoint) {
		return challengeEndpoint;
	}

	const issuer = asMeta.issuer.endsWith('/') ? asMeta.issuer.slice(0, -1) : asMeta.issuer;
	return `${issuer}/challenge`;
}

function getAttesterPrivateJwk(): jose.JWK | null {
	if (!OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_PRIVATE_JWK) {
		return null;
	}

	try {
		return JSON.parse(OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_PRIVATE_JWK);
	} catch (err) {
		console.error('Failed to parse OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_PRIVATE_JWK', err);
		return null;
	}
}

async function getClientInstance(clientId: string): Promise<ClientInstance> {
	let instance = clientInstances.get(clientId);
	if (!instance) {
		instance = (async () => {
			const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true });
			const publicJwk = await jose.exportJWK(publicKey);
			return { privateKey, publicJwk };
		})();
		clientInstances.set(clientId, instance);
	}
	return instance;
}

async function getAttestationChallenge(
	asMeta: OpenidAuthorizationServerMetadata,
	httpProxy: HttpProxyLike,
): Promise<string> {
	const response = await httpProxy.post(
		getChallengeEndpoint(asMeta),
		'',
		{ Accept: 'application/json' },
	);

	const headers = Object.fromEntries(
		Object.entries(response.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value])
	);
	const data = typeof response.data === 'object' && response.data !== null
		? response.data as Record<string, unknown>
		: {};
	const nestedData = typeof data.data === 'object' && data.data !== null
		? data.data as Record<string, unknown>
		: {};

	const headerChallenge = headers['oauth-client-attestation-challenge'];
	const bodyChallenge = data.attestation_challenge ?? nestedData.attestation_challenge;
	const nestedHeaderChallenge = typeof data.headers === 'object' && data.headers !== null
		? Object.entries(data.headers as Record<string, unknown>)
			.find(([key]) => key.toLowerCase() === 'oauth-client-attestation-challenge')?.[1]
		: undefined;
	const challenge = typeof headerChallenge === 'string'
		? headerChallenge
		: typeof bodyChallenge === 'string'
			? bodyChallenge
			: nestedHeaderChallenge;
	if (typeof challenge !== 'string' || challenge.length === 0) {
		throw new Error(`AS challenge endpoint did not return an attestation challenge (status ${response.status})`);
	}

	return challenge;
}

function getChallengeFromResponse(response: Response): string | null {
	return response.headers.get('oauth-client-attestation-challenge');
}

async function buildClientAttestationHeaders(
	asMeta: OpenidAuthorizationServerMetadata,
	clientId: string,
	httpProxy: HttpProxyLike,
	options: AttestationHeaderOptions = {},
): Promise<Record<string, string>> {
	const attesterPrivateJwk = getAttesterPrivateJwk();
	if (!attesterPrivateJwk) {
		throw new Error('OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_PRIVATE_JWK is required when ABCA is enabled');
	}

	const [{ privateKey: clientPrivateKey, publicJwk }, attesterPrivateKey, challenge] = await Promise.all([
		getClientInstance(clientId),
		jose.importJWK(attesterPrivateJwk, 'ES256'),
		options.challenge ?? getAttestationChallenge(asMeta, httpProxy),
	]);
	const now = Math.floor(Date.now() / 1000);

	const attestation = await new jose.SignJWT({
		cnf: { jwk: publicJwk },
	})
		.setProtectedHeader({ alg: 'ES256', typ: 'oauth-client-attestation+jwt' })
		.setIssuer(OPENID4VCI_CLIENT_ATTESTATION_ISSUER as string)
		.setSubject(clientId)
		.setIssuedAt(now)
		.setExpirationTime(now + OPENID4VCI_CLIENT_ATTESTATION_LIFETIME_SECONDS)
		.sign(attesterPrivateKey);

	const pop = await new jose.SignJWT({
		challenge,
	})
		.setProtectedHeader({ alg: 'ES256', typ: 'oauth-client-attestation-pop+jwt' })
		.setIssuer(clientId)
		.setAudience(asMeta.issuer)
		.setJti(crypto.randomUUID())
		.setIssuedAt(now)
		.sign(clientPrivateKey);

	return {
		'OAuth-Client-Attestation': attestation,
		'OAuth-Client-Attestation-PoP': pop,
	};
}

export async function getClientAttestationHeaders(
	asMeta: OpenidAuthorizationServerMetadata,
	clientId: string | null,
	httpProxy: HttpProxyLike,
	options: AttestationHeaderOptions = {},
): Promise<Record<string, string>> {
	if (!OPENID4VCI_CLIENT_ATTESTATION_ENABLED || !clientId) {
		return {};
	}

	if (!OPENID4VCI_CLIENT_ATTESTATION_ISSUER) {
		throw new Error('OPENID4VCI_CLIENT_ATTESTATION_ISSUER is required when ABCA is enabled');
	}

	return buildClientAttestationHeaders(asMeta, clientId, httpProxy, options);
}

export async function retryWithFreshAttestationChallenge(
	response: Response,
	retry: (headers: Record<string, string>) => Promise<Response>,
	context: {
		asMeta: OpenidAuthorizationServerMetadata;
		clientId: string | null;
		httpProxy: HttpProxyLike;
	},
): Promise<Response> {
	if (!OPENID4VCI_CLIENT_ATTESTATION_ENABLED || !context.clientId) {
		return response;
	}

	const copy = response.clone();
	let json: any = null;
	try {
		json = await copy.json();
	} catch {
		return response;
	}

	if (json?.error !== 'use_attestation_challenge') {
		return response;
	}

	const challenge = getChallengeFromResponse(response);
	if (!challenge) {
		return response;
	}

	const headers = await getClientAttestationHeaders(
		context.asMeta,
		context.clientId,
		context.httpProxy,
		{ challenge },
	);

	return retry(headers);
}
