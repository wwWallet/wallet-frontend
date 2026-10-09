import { describe, expect, it, vi } from "vitest";
import { addSaveCredentialIssuanceSessionEvent, CurrentSchema, foldState, getSchema, mergeEventHistories, SchemaV1, SchemaV2, SchemaV3 } from "./WalletStateSchema";

const session = {
	sessionId: 1, credentialIssuerIdentifier: "https://issuer.example", state: "state",
	code_verifier: "verifier", credentialConfigurationId: "credential", created: 123,
};

describe("Wallet state schema version 4", () => {
	it.each([SchemaV1, SchemaV2, SchemaV3])("migrates earlier states without changing their sessions or input", schema => {
		const container = schema.WalletStateOperations.initialWalletStateContainer();
		container.S.credentialIssuanceSessions = [session];
		const original = structuredClone(container.S);
		const migrated = CurrentSchema.WalletStateOperations.migrateState(container.S);
		expect(migrated).toEqual({ ...original, schemaVersion: 4 });
		expect(container.S).toEqual(original);
		expect(migrated.credentialIssuanceSessions[0].walletInstanceAttestation).toBeUndefined();
	});

	it("persists a WIA through serialization, history merge and event folding", async () => {
		const initial = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		const saved = await addSaveCredentialIssuanceSessionEvent(initial, 1, session.credentialIssuerIdentifier,
			session.state, session.code_verifier, session.credentialConfigurationId,
			undefined, undefined, undefined, undefined, session.created, "signed-wia");
		const restored = JSON.parse(JSON.stringify(saved));
		const merged = await mergeEventHistories(restored, initial);
		expect(foldState(merged as CurrentSchema.WalletStateContainer).credentialIssuanceSessions).toEqual([{ ...session, walletInstanceAttestation: "signed-wia" }]);
	});

	it("replays legacy events before migrating and accepts sessions without WIA", async () => {
		const legacy = SchemaV3.WalletStateOperations.initialWalletStateContainer();
		const event = { ...session, type: "save_credential_issuance_session" as const,
			schemaVersion: 3, parentHash: "", eventId: 1, timestampSeconds: 123 };
		const replayed = CurrentSchema.WalletStateOperations.walletStateReducer(legacy.S, event);
		expect(replayed.schemaVersion).toBe(3);
		expect(foldState({ ...legacy, events: [event] }).schemaVersion).toBe(4);
		const migrated = CurrentSchema.WalletStateOperations.migrateState(replayed);
		expect(CurrentSchema.WalletStateOperations.migrateState(
			CurrentSchema.WalletStateOperations.walletStateReducer(migrated, { ...event, schemaVersion: 4 }),
		).credentialIssuanceSessions[0].walletInstanceAttestation).toBeUndefined();
		expect(() => CurrentSchema.WalletStateOperations.walletStateReducer(migrated, event)).toThrow();
	});

	it("dispatches version 4 and rejects future versions", () => {
		expect(getSchema(4)).toBe(CurrentSchema.WalletStateOperations);
		const current = CurrentSchema.WalletStateOperations.initialWalletStateContainer().S;
		expect(() => CurrentSchema.WalletStateOperations.migrateState({ ...current, schemaVersion: 5 })).toThrow();
	});

	it("applies every non-save event without calling the V3 state reducer or losing session data", () => {
		const keypair = {
			kid: "key", did: "did:example:key", alg: "ES256",
			publicKey: { kty: "EC" }, privateKey: { kty: "EC", d: "test-key" },
		};
		const credential = {
			credentialId: 1, format: "test", data: "credential", kid: "key",
			instanceId: 1, batchId: 1, credentialIssuerIdentifier: session.credentialIssuerIdentifier,
			credentialConfigurationId: session.credentialConfigurationId,
		};
		const presentation = {
			presentationId: 1, transactionId: 1, data: "presentation", usedCredentialIds: [1],
			presentationTimestampSeconds: 123, audience: "verifier",
		};
		const initial = CurrentSchema.WalletStateOperations.initialWalletStateContainer().S;
		const state = {
			...initial, keypairs: [{ kid: "key", keypair }], credentials: [credential],
			presentations: [presentation],
			credentialIssuanceSessions: [{ ...session, walletInstanceAttestation: "signed-wia",
				dpop: { dpopJti: "jti", dpopPrivateKeyJwk: keypair.privateKey, dpopAlg: "ES256" } }],
		};
		const attributes: CurrentSchema.WalletSessionEventTypeAttributes[] = [
			{ type: "new_credential", ...credential, credentialId: 2 },
			{ type: "delete_credential", credentialId: 1 },
			{ type: "new_keypair", kid: "other-key", keypair: { ...keypair, kid: "other-key" } },
			{ type: "delete_keypair", kid: "key" },
			{ type: "new_presentation", ...presentation, presentationId: 2 },
			{ type: "delete_presentation", presentationId: 1 },
			{ type: "alter_settings", settings: { openidRefreshTokenMaxAgeInSeconds: "60" } },
			{ type: "delete_credential_issuance_session", sessionId: 1 },
		];
		const original = structuredClone(state);
		for (const attribute of attributes) {
			const event = { ...attribute, schemaVersion: 4, parentHash: "", eventId: 1, timestampSeconds: 123 };
			const expected = SchemaV3.WalletStateOperations.walletStateReducer(
				{ ...state, schemaVersion: 3 }, { ...event, schemaVersion: 3 },
			);
			const legacyReducer = vi.spyOn(SchemaV3.WalletStateOperations, "walletStateReducer")
				.mockImplementation(() => { throw new Error("V4 must not delegate to the V3 state reducer"); });
			try {
				const result = CurrentSchema.WalletStateOperations.walletStateReducer(state, event);
				expect(result).toEqual({ ...expected, schemaVersion: 4 });
				expect(legacyReducer).not.toHaveBeenCalled();
				expect(state).toEqual(original);
			} finally {
				legacyReducer.mockRestore();
			}
		}
	});
});
