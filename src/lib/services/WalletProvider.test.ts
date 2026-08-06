import { decodeJwt, decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import { describe, expect, it, vi } from "vitest";
import {
	activateWalletInstance,
	consumeKeyAttestation,
	createKeyAttestationProof,
	issueKeyAttestation,
	resolveWalletProviderEvidenceProvider,
} from "./WalletProvider";

const context = {
	userHandle: "user",
	walletName: "wwWallet",
	walletVersion: "test",
};

describe("WalletProvider", () => {
	it("activates an instance using evidence from the platform provider", async () => {
		const provider = {
			getActivationEvidence: vi.fn().mockResolvedValue({ token: "activation" }),
			getKeyAttestationEvidence: vi.fn(),
		};
		const post = vi.fn().mockResolvedValue({ data: { wallet_instance_id: "instance-id" } });

		await expect(activateWalletInstance(post, provider, context)).resolves.toBe("instance-id");
		expect(post).toHaveBeenCalledWith("/wallet-provider/instances/activate", {
			wallet_name: "wwWallet",
			wallet_version: "test",
			activation_evidence: { token: "activation" },
		});
	});

	it("requests and consumes a key attestation for a JWT proof", async () => {
		const provider = {
			getActivationEvidence: vi.fn(),
			getKeyAttestationEvidence: vi.fn().mockResolvedValue({ token: "key" }),
		};
		const post = vi.fn()
			.mockResolvedValueOnce({
				data: {
					id: "attestation-id",
					key_attestation: "jwt",
					expires_at: 10,
					key_storage_status_expires_at: 20,
				},
			})
			.mockResolvedValueOnce({ data: undefined });
		const jwks = [{ kty: "EC", crv: "P-256", x: "x", y: "y" }];

		const result = await issueKeyAttestation(post, provider, {
			...context,
			walletInstanceId: "instance-id",
			jwks,
			proofType: "jwt",
		});
		await consumeKeyAttestation(post, result.id);

		expect(post).toHaveBeenNthCalledWith(1, "/wallet-provider/key-attestations", {
			wallet_instance_id: "instance-id",
			jwks,
			key_attestation_evidence: { token: "key" },
			proof_type: "jwt",
		});
		expect(post).toHaveBeenNthCalledWith(2, "/wallet-provider/key-attestations/attestation-id/consume", {});
	});

	it("creates a nonce-bound JWT proof signed by the attested key", async () => {
		const { privateKey, publicKey } = await crypto.subtle.generateKey(
			{ name: "ECDSA", namedCurve: "P-256" },
			true,
			["sign"],
		);
		const [privateJwk, publicJwk] = await Promise.all([
			crypto.subtle.exportKey("jwk", privateKey),
			crypto.subtle.exportKey("jwk", publicKey),
		]) as [Record<string, unknown>, Record<string, unknown>];
		const proof = await createKeyAttestationProof({
			keyPair: { alg: "ES256", privateKey: privateJwk, publicKey: publicJwk },
			keyAttestation: "provider-signed-ka",
			nonce: "issuer-nonce",
			audience: "https://issuer.example",
			issuer: "wallet-client",
		});

		const verificationKey = await importJWK(publicJwk, "ES256");
		await expect(jwtVerify(proof, verificationKey, {
			audience: "https://issuer.example",
			issuer: "wallet-client",
		})).resolves.toBeDefined();
		expect(decodeProtectedHeader(proof)).toMatchObject({
			alg: "ES256",
			typ: "openid4vci-proof+jwt",
			key_attestation: "provider-signed-ka",
			jwk: { ...publicJwk, key_ops: ["verify"] },
		});
		expect(decodeJwt(proof)).toMatchObject({ nonce: "issuer-nonce" });
	});

	it("requires an explicit development opt-in when no platform provider exists", () => {
		expect(() => resolveWalletProviderEvidenceProvider(false, {})).toThrow(/No Wallet Provider evidence provider/);
		expect(resolveWalletProviderEvidenceProvider(true, {})).toBeDefined();
	});
});
