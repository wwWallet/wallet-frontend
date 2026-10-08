// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as jose from "jose";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { usePushedAuthorizationRequest } from "./PushedAuthorizationRequest";

const mocks = vi.hoisted(() => ({ post: vi.fn(), requestWia: vi.fn(), generateKeypairs: vi.fn(), updatePrivateData: vi.fn(), commit: vi.fn() }));

vi.mock("../../HttpProxy/HttpProxy", () => ({ useHttpProxy: () => ({ post: mocks.post }) }));
vi.mock("../../WalletProvider", () => ({
	usewalletProvider: () => ({ requestWalletInstanceAttestation: mocks.requestWia }),
}));
vi.mock("@/context/SessionContext", async () => {
	const { createContext } = await import("react");
	return { default: createContext({
		keystore: { generateKeypairs: mocks.generateKeypairs },
		api: { updatePrivateData: mocks.updatePrivateData },
	}) };
});
vi.mock("@/config", () => ({ MODE: "production" }));
vi.mock("oauth4webapi", async importOriginal => ({
	...await importOriginal<typeof import("oauth4webapi")>(),
	// Node WebCrypto and jsdom use different ArrayBuffer realms. PKCE itself
	// is unchanged by this feature; isolate that library call in this hook test.
	calculatePKCECodeChallenge: async () => "test-code-challenge",
}));

vi.mock("jose", async importOriginal => ({
	...await importOriginal<typeof import("jose")>(),
	// Browser jose returns CryptoKey; its Node entry returns KeyObject instead.
	importJWK: async (jwk: JsonWebKey) => crypto.subtle.importKey(
		"jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, jwk.d ? ["sign"] : ["verify"],
	),
}));

const metadata = {
	issuer: "https://as.example/tenant/",
	token_endpoint: "https://as.example/token",
	pushed_authorization_request_endpoint: "https://as.example/par",
	token_endpoint_auth_methods_supported: ["attest_jwt_client_auth"],
};
const createParams = () => ({
	client_id: "https://wallet.example/callback/",
	redirect_uri: "https://wallet.example/callback/",
	response_type: "code",
});


describe("WIA retrieval before PAR", () => {
	beforeEach(async () => {
		const { privateKey, publicKey } = await jose.generateKeyPair("ES256", { extractable: true });
		mocks.generateKeypairs.mockReset().mockResolvedValue([
			{ keypairs: [{ alg: "ES256", privateKey: await jose.exportJWK(privateKey), publicKey: { ...await jose.exportJWK(publicKey), key_ops: [] } }] },
			"encrypted-container", mocks.commit,
		]);
		mocks.updatePrivateData.mockReset().mockResolvedValue(undefined);
		mocks.commit.mockReset().mockResolvedValue(undefined);
		mocks.post.mockReset().mockResolvedValue({
			status: 201,
			headers: { "content-type": "application/json" },
			data: { request_uri: "urn:example:par:request", expires_in: 60 },
		});
		mocks.requestWia.mockReset().mockResolvedValue({ wallet_instance_attestation: "provider-signed-wia" });
	});

	it("requests WIA before PAR and returns the matching flow key for encrypted persistence", async () => {
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		const response = await result.current.sendPushedAuthorizationRequest(metadata, createParams());
		const [publicJwk, clientId, issuer] = mocks.requestWia.mock.calls[0];
		expect(mocks.generateKeypairs).toHaveBeenCalledWith(1);
		expect(mocks.updatePrivateData).toHaveBeenCalledWith("encrypted-container");
		expect(mocks.updatePrivateData.mock.invocationCallOrder[0]).toBeLessThan(mocks.commit.mock.invocationCallOrder[0]);
		expect(mocks.commit.mock.invocationCallOrder[0]).toBeLessThan(mocks.requestWia.mock.invocationCallOrder[0]);
		expect(publicJwk).not.toHaveProperty("d");
		expect(publicJwk.key_ops).toEqual(['verify']);
		expect(clientId).toBe("https://wallet.example/callback/");
		expect(issuer).toBe(metadata.issuer);
		expect(mocks.requestWia.mock.invocationCallOrder[0]).toBeLessThan(mocks.post.mock.invocationCallOrder[0]);
		expect(response.walletInstanceAttestation).toBe("provider-signed-wia");
		expect(response.dpop?.dpopPublicKeyJwk).toEqual(publicJwk);
		const privateKey = createPrivateKey({ key: response.dpop!.dpopPrivateKeyJwk, format: "jwk" });
		const { key_ops, ...publicKeyMaterial } = publicJwk;
		expect(key_ops).toEqual(['verify']);
		expect(createPublicKey(privateKey).export({ format: "jwk" })).toEqual(publicKeyMaterial);
		const body = new URLSearchParams(mocks.post.mock.calls[0][1]);
		expect(body.get("dpop_jkt")).toBe(await jose.calculateJwkThumbprint(publicJwk));
		expect(body.get("code_challenge_method")).toBe("S256");
		expect(response.code_verifier).toBeTruthy();
		const headers = mocks.post.mock.calls[0][2];
		expect(headers['oauth-client-attestation']).toBe('provider-signed-wia');
		const proof = await jose.jwtVerify(headers['oauth-client-attestation-pop'], await jose.importJWK(publicJwk, 'ES256'), {
			audience: metadata.issuer, typ: 'oauth-client-attestation-pop+jwt',
		});
		expect(proof.payload.jti).toBeTruthy();
		expect(body.has('client_assertion')).toBe(false);
	});

	it('retries a challenge error once with a fresh proof and preserves PKCE', async () => {
		mocks.post.mockResolvedValueOnce({
			status: 400,
			headers: { 'oauth-client-attestation-challenge': 'fresh-challenge' },
			data: { error: 'use_attestation_challenge' },
		});
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await result.current.sendPushedAuthorizationRequest(metadata, createParams());
		expect(mocks.post).toHaveBeenCalledTimes(2);
		const first = jose.decodeJwt(mocks.post.mock.calls[0][2]['oauth-client-attestation-pop']);
		const second = jose.decodeJwt(mocks.post.mock.calls[1][2]['oauth-client-attestation-pop']);
		expect(second.challenge).toBe('fresh-challenge');
		expect(second.jti).not.toBe(first.jti);
		expect(mocks.post.mock.calls[1][1]).toBe(mocks.post.mock.calls[0][1]);
	});

	it('does not retry indefinitely when the server keeps requiring a challenge', async () => {
		mocks.post.mockResolvedValue({
			status: 400,
			headers: { 'oauth-client-attestation-challenge': 'fresh-challenge' },
			data: { error: 'use_attestation_challenge' },
		});
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams())).rejects.toThrow('use_attestation_challenge');
		expect(mocks.post).toHaveBeenCalledTimes(2);
	});

	it('does not retry a challenge error without a challenge header', async () => {
		mocks.post.mockResolvedValue({ status: 400, headers: {}, data: { error: 'use_attestation_challenge' } });
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams())).rejects.toThrow('use_attestation_challenge');
		expect(mocks.post).toHaveBeenCalledOnce();
	});

	it("preserves existing PAR behavior when ABCA is not advertised", async () => {
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		const response = await result.current.sendPushedAuthorizationRequest({
			...metadata, token_endpoint_auth_methods_supported: ["none"],
		}, createParams());
		expect(mocks.generateKeypairs).not.toHaveBeenCalled();
		expect(mocks.requestWia).not.toHaveBeenCalled();
		expect(response.dpop).toBeUndefined();
		expect(response.walletInstanceAttestation).toBeUndefined();
		expect(mocks.post).toHaveBeenCalledOnce();
	});

	it.each(["generateKeypairs", "updatePrivateData", "commit"] as const)(
		"stops before WIA and PAR when %s fails", async step => {
			mocks[step].mockRejectedValue(new Error("Keystore persistence failed"));
			const { result } = renderHook(() => usePushedAuthorizationRequest());
			await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams()))
				.rejects.toThrow("Keystore persistence failed");
			expect(mocks.requestWia).not.toHaveBeenCalled();
			expect(mocks.post).not.toHaveBeenCalled();
			expect(mocks.commit).toHaveBeenCalledTimes(step === "commit" ? 1 : 0);
		},
	);

	it("stops before PAR when WIA generation fails", async () => {
		mocks.requestWia.mockResolvedValue(null);
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams()))
			.rejects.toThrow("Failed to get Wallet Instance Attestation");
		expect(mocks.post).not.toHaveBeenCalled();
	});
});
