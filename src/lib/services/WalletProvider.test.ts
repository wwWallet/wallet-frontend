// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usewalletProvider } from "./WalletProvider";

const mocks = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock("@/context/SessionContext", async () => {
	const { createContext } = await import("react");
	return { default: createContext({ api: { post: mocks.post } }) };
});

const publicJwk = { kty: "EC", crv: "P-256", x: "public-x", y: "public-y" };

describe("Wallet Provider WIA request", () => {
	beforeEach(() => mocks.post.mockReset());
	afterEach(() => vi.restoreAllMocks());

	it("uses authenticated backend post with the public key, client ID and AS issuer", async () => {
		mocks.post.mockResolvedValue({ data: { wallet_instance_attestation: "provider-signed-wia" } });
		const { result } = renderHook(() => usewalletProvider());
		const response = await result.current.requestWalletInstanceAttestation(
			publicJwk, "https://wallet.example/callback/", "https://as.example/tenant/",
		);
		expect(mocks.post).toHaveBeenCalledWith("/wallet-provider/wallet-instance-attestation/generate", {
			jwks: [publicJwk],
			openid4vci: {
				client_id: "https://wallet.example/callback/",
				authorization_server: "https://as.example/tenant/",
			},
		});
		expect(response).toEqual({ wallet_instance_attestation: "provider-signed-wia" });
	});

	it.each([undefined, null, {}, { wallet_instance_attestation: "" }, { wallet_instance_attestation: 123 }])(
		"returns null for an invalid response: %j", async data => {
			mocks.post.mockResolvedValue({ data });
			const { result } = renderHook(() => usewalletProvider());
			await expect(result.current.requestWalletInstanceAttestation(publicJwk, "wallet", "https://as.example"))
				.resolves.toBeNull();
		},
	);

	it("returns null when the backend request fails", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		mocks.post.mockRejectedValue(new Error("Backend unavailable"));
		const { result } = renderHook(() => usewalletProvider());
		await expect(result.current.requestWalletInstanceAttestation(publicJwk, "wallet", "https://as.example"))
			.resolves.toBeNull();
	});
});
