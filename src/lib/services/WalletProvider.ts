import { importJWK, JWK, SignJWT } from "jose";

export type WalletProviderActivationContext = {
	userHandle: string;
	walletName: string;
	walletVersion: string;
};

export type WalletProviderKeyAttestationContext = WalletProviderActivationContext & {
	walletInstanceId: string;
	jwks: JWK[];
	proofType: "jwt" | "attestation";
	nonce?: string;
};

export type KeyAttestationProofContext = {
	keyPair: {
		alg: string;
		publicKey: JWK;
		privateKey: JWK;
	};
	keyAttestation: string;
	nonce: string;
	audience: string;
	issuer: string;
};

export interface WalletProviderEvidenceProvider {
	getActivationEvidence(context: WalletProviderActivationContext): Promise<Record<string, unknown>>;
	getKeyAttestationEvidence(context: WalletProviderKeyAttestationContext): Promise<Record<string, unknown>>;
}

declare global {
	interface Window {
		/** Supplied by a trusted native wrapper or platform integrity SDK. */
		walletProviderEvidenceProvider?: WalletProviderEvidenceProvider;
	}
}

type BackendPost = (path: string, body: object) => Promise<{ data: unknown }>;

export type IssuedKeyAttestation = {
	id: string;
	keyAttestation: string;
	expiresAt: number;
	keyStorageStatusExpiresAt: number;
};

export function resolveWalletProviderEvidenceProvider(
	allowDevelopmentPlaceholder: boolean,
	windowObject: Pick<Window, "walletProviderEvidenceProvider"> = window,
): WalletProviderEvidenceProvider {
	if (windowObject.walletProviderEvidenceProvider) {
		return windowObject.walletProviderEvidenceProvider;
	}
	if (!allowDevelopmentPlaceholder) {
		throw new Error("No Wallet Provider evidence provider is configured");
	}

	return {
		async getActivationEvidence(context) {
			return { type: "development-placeholder", wallet_name: context.walletName };
		},
		async getKeyAttestationEvidence(context) {
			return {
				type: "development-placeholder",
				wallet_instance_id: context.walletInstanceId,
			};
		},
	};
}

export async function activateWalletInstance(
	post: BackendPost,
	evidenceProvider: WalletProviderEvidenceProvider,
	context: WalletProviderActivationContext,
): Promise<string> {
	const activationEvidence = await evidenceProvider.getActivationEvidence(context);
	assertEvidence(activationEvidence, "activation");
	const response = await post("/wallet-provider/instances/activate", {
		wallet_name: context.walletName,
		wallet_version: context.walletVersion,
		activation_evidence: activationEvidence,
	});
	const data = asRecord(response.data);
	if (typeof data.wallet_instance_id !== "string" || data.wallet_instance_id.length === 0) {
		throw new Error("Cannot parse wallet_instance_id from wallet-backend-server");
	}
	return data.wallet_instance_id;
}

export async function issueKeyAttestation(
	post: BackendPost,
	evidenceProvider: WalletProviderEvidenceProvider,
	context: WalletProviderKeyAttestationContext,
): Promise<IssuedKeyAttestation> {
	if (context.proofType === "attestation" && !context.nonce) {
		throw new Error("A nonce is required for an attestation proof");
	}
	const keyEvidence = await evidenceProvider.getKeyAttestationEvidence(context);
	assertEvidence(keyEvidence, "key attestation");
	const response = await post("/wallet-provider/key-attestations", {
		wallet_instance_id: context.walletInstanceId,
		jwks: context.jwks,
		key_attestation_evidence: keyEvidence,
		proof_type: context.proofType,
		...(context.proofType === "attestation" ? { openid4vci: { nonce: context.nonce } } : {}),
	});
	const data = asRecord(response.data);
	if (
		typeof data.id !== "string" ||
		typeof data.key_attestation !== "string" ||
		typeof data.expires_at !== "number" ||
		typeof data.key_storage_status_expires_at !== "number"
	) {
		throw new Error("Cannot parse key attestation response from wallet-backend-server");
	}
	return {
		id: data.id,
		keyAttestation: data.key_attestation,
		expiresAt: data.expires_at,
		keyStorageStatusExpiresAt: data.key_storage_status_expires_at,
	};
}

export async function createKeyAttestationProof(context: KeyAttestationProofContext): Promise<string> {
	const privateKey = await importJWK(context.keyPair.privateKey, context.keyPair.alg);
	return await new SignJWT({
		nonce: context.nonce,
		aud: context.audience,
		iss: context.issuer,
	})
		.setIssuedAt()
		.setProtectedHeader({
			alg: context.keyPair.alg,
			typ: "openid4vci-proof+jwt",
			jwk: {
				...context.keyPair.publicKey,
				key_ops: ["verify"],
			} as JWK,
			key_attestation: context.keyAttestation,
		})
		.sign(privateKey);
}

export async function consumeKeyAttestation(post: BackendPost, id: string): Promise<void> {
	await post(`/wallet-provider/key-attestations/${encodeURIComponent(id)}/consume`, {});
}

export function isMissingWalletInstanceError(error: unknown): boolean {
	return typeof error === "object" && error !== null &&
		"response" in error && typeof error.response === "object" && error.response !== null &&
		"status" in error.response && error.response.status === 404;
}

function assertEvidence(value: unknown, description: string): asserts value is Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new Error(`Wallet Provider ${description} evidence must be a JSON object`);
	}
}

function asRecord(value: unknown): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new Error("Invalid response from wallet-backend-server");
	}
	return value as Record<string, unknown>;
}
