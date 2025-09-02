import { assert, describe, it } from "vitest";
import { findDivergencePoint, WalletStateContainer, WalletStateOperations } from "./WalletStateOperations";
import { WalletStateUtils } from "./WalletStateUtils";
import { CredentialKeyPair } from "./keystore";

describe("The WalletStateOperations", () => {
	it("should successfully apply 'new_credential' events on empty baseState", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		const s1 = WalletStateOperations.walletStateReducer(container.S, container.events[0]);

		assert.strictEqual(s1.credentials[0].data, "cred1");
		assert(await WalletStateOperations.eventHistoryIsConsistent(container));

		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container.S = WalletStateOperations.walletStateReducer(s1, container.events[1]);
		assert.strictEqual(container.S.credentials[1].data, "cred2");
	});

	it("should successfully apply 'delete_credential' event on a baseState that includes credentials", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container.S = WalletStateOperations.walletStateReducer(container.S, container.events[0]);

		container = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		container.S = WalletStateOperations.walletStateReducer(container.S, container.events[1]);
		assert.strictEqual(container.S.credentials.length, 0);
	});

	it("should successfully find the correct point of divergence between two event histories and merge them", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		let container1 = await WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		container1 = await WalletStateOperations.addNewCredentialEvent(container1, "cred1b", "", "");

		let container2: WalletStateContainer = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[1] as any).credentialId,
		);
		container2 = await WalletStateOperations.addNewCredentialEvent(container2, "cred2x", "", "");
		container2 = await WalletStateOperations.addNewCredentialEvent(container2, "cred2y", "", "");

		const result = findDivergencePoint(container1.events, container2.events);
		// verify that E3 is the actual point of divergence
		assert.strictEqual(
			await WalletStateUtils.calculateEventHash(result),
			await WalletStateUtils.calculateEventHash(container.events[2]),
		);

		const merged = await WalletStateOperations.mergeEventHistories(container1, container2);
		const expectMergedEvent2_4 = await WalletStateUtils.reparent(
			container2.events[4],
			container1.events[container1.events.length - 1],
		);
		const expectMergedEvent2_5 = await WalletStateUtils.reparent(container2.events[5], expectMergedEvent2_4);
		const expectMergedEvent2_3 = await WalletStateUtils.reparent(container2.events[3], expectMergedEvent2_5);
		assert.deepEqual(merged, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				...container1.events.slice(3),
				expectMergedEvent2_4,
				expectMergedEvent2_5,
				expectMergedEvent2_3,
			],
		});
	});

	it("mergeEventHistories de-duplicates new_credential events by credentialId.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred0", "", "");
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addNewCredentialEvent(container, "cred2a", "", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addNewCredentialEvent(container2, "cred2b", "", "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).credentialId = (container1.events[1] as any).credentialId;

		{
			const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
			assert.deepEqual(mergedL, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					...container2.events.slice(1),
				],
			});
		}

		{
			const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[1],
					await WalletStateUtils.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_credential events by credentialId.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container.events[0].timestampSeconds = 0;
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container.events[1].timestampSeconds = 1;

		const container1 = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container1.events[2].timestampSeconds = 2;
		let container2 = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container2.events[2].timestampSeconds = 3;
		container2 = await WalletStateOperations.addDeleteCredentialEvent(container2, (container.events[1] as any).credentialId);
		container2.events[3].timestampSeconds = 4;

		{
			const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
			assert.deepEqual(mergedL, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					...container2.events.slice(2),
				],
			});
		}

		{
			const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[2],
					await WalletStateUtils.reparent(container2.events[3], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_keypair events by kid.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addNewKeypairEvent(container2, "kid1", { did: "did3" } as CredentialKeyPair);
		container2.events[2].timestampSeconds = 3;

		{
			const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
			assert.deepEqual(mergedL, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					...container2.events.slice(1),
				],
			});
		}

		{
			const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[1],
					await WalletStateUtils.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_keypair events by kid.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		container.events[0].timestampSeconds = 0;
		container = await WalletStateOperations.addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		container.events[1].timestampSeconds = 1;

		const container1 = await WalletStateOperations.addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		container1.events[2].timestampSeconds = 2;
		let container2 = await WalletStateOperations.addNewKeypairEvent(container, "kid3", { did: "did3" } as CredentialKeyPair);
		container2.events[2].timestampSeconds = 3;
		container2 = await WalletStateOperations.addNewKeypairEvent(container2, "kid2", { did: "did4" } as CredentialKeyPair);
		container2.events[3].timestampSeconds = 4;

		{
			const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
			assert.deepEqual(mergedL, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					...container2.events.slice(2),
				],
			});
		}

		{
			const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[2],
					await WalletStateUtils.reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_presentation events by eventId.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewPresentationEvent(container, 0, "data0", [], 0, "");
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addNewPresentationEvent(container, 1, "data1", [], 0, "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		container2.events[2].timestampSeconds = 3;
		container2.events[2].eventId = container1.events[1].eventId;

		{
			const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
			assert.deepEqual(mergedL, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					...container2.events.slice(1),
				],
			});
		}

		{
			const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[1],
					await WalletStateUtils.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_presentation events by eventId.", async () => {
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
		(container2.events[3] as any).eventId = (container1.events[2] as any).eventId;

		{
			const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
			assert.deepEqual(mergedL, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					...container2.events.slice(2),
				],
			});
		}

		{
			const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[2],
					await WalletStateUtils.reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories overwrites conflicting alter_settings events with the latest one.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addAlterSettingsEvent(container, { foo: "bar" });
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addAlterSettingsEvent(container, { foo: "boo" });
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addAlterSettingsEvent(container, { foo: "far" });
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addAlterSettingsEvent(container2, { foo: "zoo" });
		container2.events[2].timestampSeconds = 3;
		assert.notDeepEqual(container1.events[1], container2.events[1]);

		const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				{
					...container2.events[2],
					parentHash: container2.events[1].parentHash,
				},
			],
		});
		const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates save_credential_issuance_session events by eventId.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 0, "iss0", "", "", "");
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 1, "iss1", "", "", "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 2, "iss2a", "", "", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container2, 3, "iss2b", "", "", "");
		container2.events[2].timestampSeconds = 3;
		container2.events[2].eventId = container1.events[1].eventId;

		const mergedL = await WalletStateOperations.mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				...container2.events.slice(1),
			],
		});
		const mergedR = await WalletStateOperations.mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await WalletStateUtils.reparent(container2.events[1], container1.events[1]),
			],
		});
	});

	it("resolves a trivial merge by returning the container unchanged.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 1>", "mso_mdoc", "");
		container = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		const divp = findDivergencePoint(container.events, container.events);
		assert.strictEqual(divp, container.events[1]);
		const merged = await WalletStateOperations.mergeEventHistories(container, container);
		assert.deepEqual(merged, container);
	});

	it("resolves a fast-forward merge by returning the younger container unchanged.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 1>", "mso_mdoc", "");
		container = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		let container2 = await WalletStateOperations.addNewCredentialEvent(container, "<credential 2>", "mso_mdoc", "");

		const divp = findDivergencePoint(container.events, container2.events);
		assert.strictEqual(divp, container.events[1]);

		const mergedR = await WalletStateOperations.mergeEventHistories(container, container2);
		assert.deepEqual(mergedR, container2);
		const mergedL = await WalletStateOperations.mergeEventHistories(container2, container);
		assert.deepEqual(mergedL, mergedR);
	});

	it("should successfully fold one event at a time", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		const e1Hash = await WalletStateUtils.calculateEventHash(container.events[0]);
		container = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		const e2Hash = await WalletStateUtils.calculateEventHash(container.events[0]);

		assert.strictEqual(container.lastEventHash, e1Hash);
		container = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});


	it("should successfully fold both events at once", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		const e2Hash = await WalletStateUtils.calculateEventHash(container.events[1]);
		container = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});

	it("foldOldEventsIntoBaseState does not modify the parent hashes of unfolded events.", async () => {
		const now = Date.now() / 1000;
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container.events[0].timestampSeconds = now - 10;

		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container.events[1].timestampSeconds = now + 10;

		const folded = await WalletStateOperations.foldOldEventsIntoBaseState(container, 0);

		assert.deepEqual(folded.events, container.events.slice(1));
		assert.strictEqual(folded.lastEventHash, container.events[1].parentHash);
	});

	it("mergeEventHistories maintains the per-branch order of events.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container.events[0].timestampSeconds = 0;
		container = await WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container.events[1].timestampSeconds = 1;
		container = await WalletStateOperations.addDeleteCredentialEvent(container, (container.events[0] as any).credentialId);
		container.events[2].timestampSeconds = 2;

		let container1 = await WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		container1.events[3].timestampSeconds = 10;
		container1 = await WalletStateOperations.addNewCredentialEvent(container1, "cred1b", "", "");
		container1.events[4].timestampSeconds = 20;

		let container2 = await WalletStateOperations.addDeleteCredentialEvent(container, (container.events[1] as any).credentialId);
		container2.events[3].timestampSeconds = 15;
		container2 = await WalletStateOperations.addNewCredentialEvent(container2, "cred2x", "", "");
		container2.events[4].timestampSeconds = 16;
		container2 = await WalletStateOperations.addNewCredentialEvent(container2, "cred2y", "", "");
		container2.events[5].timestampSeconds = 25;

		const merged = await WalletStateOperations.mergeEventHistories(container1, container2);
		const expectEvent4 = container1.events[3];
		const expectEvent5 = await WalletStateUtils.reparent(container2.events[3], expectEvent4);
		const expectEvent6 = await WalletStateUtils.reparent(container2.events[4], expectEvent5);
		const expectEvent7 = await WalletStateUtils.reparent(container1.events[4], expectEvent6);
		const expectEvent8 = await WalletStateUtils.reparent(container2.events[5], expectEvent7);
		assert.deepEqual(merged, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				expectEvent4,
				expectEvent5,
				expectEvent6,
				expectEvent7,
				expectEvent8,
			],
		});
	});
});
