import { assert, describe, it } from "vitest";
import { WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion2";
import { mergeEventHistories, SchemaV1, SchemaV2 } from "./WalletStateSchema";
import { CredentialKeyPair } from "./keystore";


describe("WalletStateSchemaVersion2", () => {

	it("mergeEventHistories de-duplicates new_credential events between v1 and v2 by credentialId.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred0", "", "");
		container.events[0].timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await SchemaV2.WalletStateOperations.addNewCredentialEvent(container, "cred2a", "", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await SchemaV2.WalletStateOperations.addNewCredentialEvent(container2, "cred2b", "", "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).credentialId = (container1.events[1] as any).credentialId;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await SchemaV2.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates delete_credential events between v1 and v2 by credentialId.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container.events[0].timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container.events[1].timestampSeconds = 1;

		const container1 = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container1.events[2].timestampSeconds = 2;
		let container2 = await SchemaV2.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container2.events[2].timestampSeconds = 3;
		container2 = await SchemaV2.WalletStateOperations.addDeleteCredentialEvent(container2, (container.events[1] as any).credentialId);
		container2.events[3].timestampSeconds = 4;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[2],
				await SchemaV2.WalletStateOperations.reparent(container2.events[3], container1.events[2]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates new_keypair events between v1 and v2 by kid.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		container.events[0].timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		container1.events[1].timestampSeconds = 1;
		let container2 = await SchemaV2.WalletStateOperations.addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		container2.events[1].timestampSeconds = 2;
		container2 = await SchemaV2.WalletStateOperations.addNewKeypairEvent(container2, "kid1", { did: "did3" } as CredentialKeyPair);
		container2.events[2].timestampSeconds = 3;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await SchemaV2.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates delete_keypair events between v1 and v2 by kid.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		container.events[0].timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		container.events[1].timestampSeconds = 1;

		const container1 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		container1.events[2].timestampSeconds = 2;
		let container2 = await SchemaV2.WalletStateOperations.addNewKeypairEvent(container, "kid3", { did: "did3" } as CredentialKeyPair);
		container2.events[2].timestampSeconds = 3;
		container2 = await SchemaV2.WalletStateOperations.addNewKeypairEvent(container2, "kid2", { did: "did4" } as CredentialKeyPair);
		container2.events[3].timestampSeconds = 4;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[2],
				await SchemaV2.WalletStateOperations.reparent(container2.events[2], container1.events[2]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates new_presentation events by presentationId, and keeps the oldest.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewPresentationEvent(container, 0, "data0", [], 0, "");
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addNewPresentationEvent(container, 1, "data1", [], 0, "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).presentationId = (container1.events[1] as any).presentationId;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates new_presentation events between v1 and v2 by presentationId.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 0, "data0", [], 0, "");
		container.events[0].timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 1, "data1", [], 0, "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await SchemaV2.WalletStateOperations.addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		container2.events[1].timestampSeconds = 2;
		container2.events[1].eventId = container1.events[1].eventId;
		container2 = await SchemaV2.WalletStateOperations.addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).presentationId = (container1.events[1] as any).presentationId;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates delete_presentation events by presentationId, and keeps the oldest.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewPresentationEvent(container, 1, "", [], 2, "");
		container.events[0].timestampSeconds = 0;
		container = await WalletStateOperations.addNewPresentationEvent(container, 1, "", [], 2, "");
		container.events[1].timestampSeconds = 1;

		const container1 = await WalletStateOperations.addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container1.events[2].timestampSeconds = 2;
		let container2 = await WalletStateOperations.addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container2.events[2].timestampSeconds = 3;
		container2 = await WalletStateOperations.addDeletePresentationEvent(container2, (container.events[1] as any).presentationId);
		container2.events[3].timestampSeconds = 4;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[2],
				await WalletStateOperations.reparent(container2.events[3], container1.events[2]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates delete_presentation events between v1 and v2 by presentationId.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 1, "", [], 2, "");
		container.events[0].timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 1, "", [], 2, "");
		container.events[1].timestampSeconds = 1;

		const container1 = await SchemaV1.WalletStateOperations.addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container1.events[2].timestampSeconds = 2;
		let container2 = await SchemaV2.WalletStateOperations.addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container2.events[2].timestampSeconds = 3;
		container2.events[2].eventId = container1.events[2].eventId;
		container2 = await SchemaV2.WalletStateOperations.addDeletePresentationEvent(container2, (container.events[1] as any).presentationId);
		container2.events[3].timestampSeconds = 4;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[2],
				await WalletStateOperations.reparent(container2.events[3], container1.events[2]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories overwrites an older v2 alter_settings event with a younger v1 one.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addAlterSettingsEvent(container, { foo: "bar" });
		container.events[0].timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addAlterSettingsEvent(container, { foo: "boo" });
		container1.events[1].timestampSeconds = 10;
		let container2 = await SchemaV2.WalletStateOperations.addAlterSettingsEvent(container, { foo: "far" });
		container2.events[1].timestampSeconds = 2;
		container2 = await SchemaV2.WalletStateOperations.addAlterSettingsEvent(container2, { foo: "zoo" });
		container2.events[2].timestampSeconds = 3;
		assert.notDeepEqual(container1.events[1], container2.events[1]);

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates save_credential_issuance_session events between v1 and v2 by eventId.", async () => {
		let container: WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 0, "iss0", "", "", "");
		container.events[0].timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 1, "iss1", "", "", "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await SchemaV2.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 2, "iss2a", "", "", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await SchemaV2.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container2, 3, "iss2b", "", "", "");
		container2.events[2].timestampSeconds = 3;
		container2.events[2].eventId = container1.events[1].eventId;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await SchemaV2.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

});
