import { assert, describe, it } from "vitest";
import { CredentialKeyPair } from "./keystore";
import { addAlterSettingsEvent, addDeleteCredentialEvent, addDeletePresentationEvent, addNewCredentialEvent, addNewKeypairEvent, addNewPresentationEvent, addSaveCredentialIssuanceSessionEvent, CurrentSchema, findMergeBase, foldNextEvent, foldOldEventsIntoBaseState, mergeEventHistories, SchemaV1 } from "./WalletStateSchema";
import { jsonParseTaggedBinary, last } from "@/util";


describe("The current WalletStateSchema version", () => {
	it("should successfully apply 'new_credential' events on empty baseState", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		const s1 = CurrentSchema.WalletStateOperations.walletStateReducer(container.S, container.events[0]);

		assert.strictEqual(s1.credentials[0].data, "cred1");
		assert(await CurrentSchema.WalletStateOperations.eventHistoryIsConsistent(container))

		container = await addNewCredentialEvent(container, "cred2", "", "");
		container.S = CurrentSchema.WalletStateOperations.walletStateReducer(s1, container.events[1]);
		assert.strictEqual(container.S.credentials[1].data, "cred2");
	});

	it("should successfully apply 'delete_credential' event on a baseState that includes credentials", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container.S = CurrentSchema.WalletStateOperations.walletStateReducer(container.S, container.events[0]);
		container = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container.S = CurrentSchema.WalletStateOperations.walletStateReducer(container.S, container.events[1]);
		assert.strictEqual(container.S.credentials.length, 0);
	});

	it("should successfully find the correct point of divergence between two event histories and merge them", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container = await addNewCredentialEvent(container, "cred2", "", "");
		container = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		let container1 = await addNewCredentialEvent(container, "cred1a", "", "");
		container1 = await addNewCredentialEvent(container1, "cred1b", "", "");

		let container2 = await addDeleteCredentialEvent(
			container,
			(container.events[1] as any).credentialId,
		);
		container2 = await addNewCredentialEvent(container2, "cred2x", "", "");
		container2 = await addNewCredentialEvent(container2, "cred2y", "", "");

		const mergeBase = await findMergeBase(container1, container2);
		assert.deepEqual(mergeBase, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: container1.events.slice(container.events.length),
			uniqueEvents2: container2.events.slice(container.events.length),
		});

		const merged = await mergeEventHistories(container1, container2);
		const expectMergedEvent2_4 = await CurrentSchema.WalletStateOperations.reparent(container2.events[4], last(container1.events));
		const expectMergedEvent2_5 = await CurrentSchema.WalletStateOperations.reparent(container2.events[5], expectMergedEvent2_4);
		const expectMergedEvent2_3 = await CurrentSchema.WalletStateOperations.reparent(container2.events[3], expectMergedEvent2_5);
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
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred0", "", "");
		last(container.events).timestampSeconds = 0;

		const container1 = await addNewCredentialEvent(container, "cred1a", "", "");
		last(container1.events).timestampSeconds = 1;
		let container2 = await addNewCredentialEvent(container, "cred2a", "", "");
		last(container2.events).timestampSeconds = 2;
		container2 = await addNewCredentialEvent(container2, "cred2b", "", "");
		last(container2.events).timestampSeconds = 3;
		(container2.events[2] as any).credentialId = (container1.events[1] as any).credentialId;

		{
			const mergedL = await mergeEventHistories(container1, container2);
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
			const mergedR = await mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[1],
					await CurrentSchema.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_credential events by credentialId.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		last(container.events).timestampSeconds = 0;
		container = await addNewCredentialEvent(container, "cred2", "", "");
		last(container.events).timestampSeconds = 1;

		const container1 = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		last(container1.events).timestampSeconds = 2;
		let container2 = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		last(container2.events).timestampSeconds = 3;
		container2 = await addDeleteCredentialEvent(container2, (container.events[1] as any).credentialId);
		last(container2.events).timestampSeconds = 4;

		{
			const mergedL = await mergeEventHistories(container1, container2);
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
			const mergedR = await mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[2],
					await CurrentSchema.WalletStateOperations.reparent(container2.events[3], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_keypair events by kid.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		last(container.events).timestampSeconds = 0;

		const container1 = await addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		last(container1.events).timestampSeconds = 1;
		let container2 = await addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		last(container2.events).timestampSeconds = 2;
		container2 = await addNewKeypairEvent(container2, "kid1", { did: "did3" } as CredentialKeyPair);
		last(container2.events).timestampSeconds = 3;

		{
			const mergedL = await mergeEventHistories(container1, container2);
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
			const mergedR = await mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[1],
					await CurrentSchema.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_keypair events by kid.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		last(container.events).timestampSeconds = 0;
		container = await addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		last(container.events).timestampSeconds = 1;

		const container1 = await addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		last(container1.events).timestampSeconds = 2;
		let container2 = await addNewKeypairEvent(container, "kid3", { did: "did3" } as CredentialKeyPair);
		last(container2.events).timestampSeconds = 3;
		container2 = await addNewKeypairEvent(container2, "kid2", { did: "did4" } as CredentialKeyPair);
		last(container2.events).timestampSeconds = 4;

		{
			const mergedL = await mergeEventHistories(container1, container2);
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
			const mergedR = await mergeEventHistories(container2, container1);
			assert.deepEqual(mergedR, {
				lastEventHash: container.lastEventHash,
				S: container.S,
				events: [
					...container.events,
					container1.events[2],
					await CurrentSchema.WalletStateOperations.reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_presentation events by presentationId, and keeps the oldest.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewPresentationEvent(container, 0, "data0", [], 0, "");
		last(container.events).timestampSeconds = 0;

		const container1 = await addNewPresentationEvent(container, 1, "data1", [], 0, "");
		last(container1.events).timestampSeconds = 1;
		let container2 = await addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		last(container2.events).timestampSeconds = 2;
		container2 = await addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		last(container2.events).timestampSeconds = 3;
		(container2.events[2] as any).presentationId = (container1.events[1] as any).presentationId;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await CurrentSchema.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates delete_presentation events by presentationId, and keeps the oldest.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewPresentationEvent(container, 1, "", [], 2, "");
		last(container.events).timestampSeconds = 0;
		container = await addNewPresentationEvent(container, 1, "", [], 2, "");
		last(container.events).timestampSeconds = 1;

		const container1 = await addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		last(container1.events).timestampSeconds = 2;
		let container2 = await addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		last(container2.events).timestampSeconds = 3;
		container2 = await addDeletePresentationEvent(container2, (container.events[1] as any).presentationId);
		last(container2.events).timestampSeconds = 4;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[2],
				await CurrentSchema.WalletStateOperations.reparent(container2.events[3], container1.events[2]),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories overwrites conflicting alter_settings events with the latest one.", async () => {
		const defaultSettings: CurrentSchema.WalletStateSettings = { openidRefreshTokenMaxAgeInSeconds: '0' };
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addAlterSettingsEvent(container, { ...defaultSettings, foo: "bar" });
		last(container.events).timestampSeconds = 0;

		const container1 = await addAlterSettingsEvent(container, { ...defaultSettings, foo: "boo" });
		last(container1.events).timestampSeconds = 1;
		let container2 = await addAlterSettingsEvent(container, { ...defaultSettings, foo: "far" });
		last(container2.events).timestampSeconds = 2;
		container2 = await addAlterSettingsEvent(container2, { ...defaultSettings, foo: "zoo" });
		last(container2.events).timestampSeconds = 3;
		assert.notDeepEqual(container1.events[1], container2.events[1]);

		const mergedL = await mergeEventHistories(container1, container2);
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
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, mergedL);
	});

	it("mergeEventHistories de-duplicates save_credential_issuance_session events by eventId.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addSaveCredentialIssuanceSessionEvent(container, 0, "iss0", "", "", "");
		last(container.events).timestampSeconds = 0;

		const container1 = await addSaveCredentialIssuanceSessionEvent(container, 1, "iss1", "", "", "");
		last(container1.events).timestampSeconds = 1;
		let container2 = await addSaveCredentialIssuanceSessionEvent(container, 2, "iss2a", "", "", "");
		last(container2.events).timestampSeconds = 2;
		container2 = await addSaveCredentialIssuanceSessionEvent(container2, 3, "iss2b", "", "", "");
		last(container2.events).timestampSeconds = 3;
		container2.events[2].eventId = container1.events[1].eventId;

		const mergedL = await mergeEventHistories(container1, container2);
		assert.deepEqual(mergedL, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				...container2.events.slice(1),
			],
		});
		const mergedR = await mergeEventHistories(container2, container1);
		assert.deepEqual(mergedR, {
			lastEventHash: container.lastEventHash,
			S: container.S,
			events: [
				...container.events,
				container1.events[1],
				await CurrentSchema.WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
	});

	it("resolves a trivial merge by returning the container unchanged.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		const mergeBase = await findMergeBase(container, container);
		assert.deepEqual(mergeBase, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: [],
			uniqueEvents2: [],
		});

		const merged = await mergeEventHistories(container, container);
		assert.deepEqual(merged, container);
	});

	it("resolves a trivial merge where one container has fully folded history by returning the unfolded container unchanged.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		const folded = await foldOldEventsIntoBaseState(container, -1);

		const mergeBaseL = await findMergeBase(container, folded);
		assert.deepEqual(mergeBaseL, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: [],
			uniqueEvents2: [],
		});
		const mergeBaseR = await findMergeBase(folded, container);
		assert.deepEqual(mergeBaseR, mergeBaseL);

		const mergedL = await mergeEventHistories(container, folded);
		assert.deepEqual(mergedL, container);
		const mergedR = await mergeEventHistories(folded, container);
		assert.deepEqual(mergedR, mergedL);
	});

	it("resolves a fast-forward merge by returning the younger container unchanged.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		let container2 = await addNewCredentialEvent(container, "cred2", "", "");

		const mergeBaseL = await findMergeBase(container, container2);
		assert.deepEqual(mergeBaseL, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: [],
			uniqueEvents2: container2.events.slice(container.events.length),
		});
		const mergeBaseR = await findMergeBase(container2, container);
		assert.deepEqual(mergeBaseR, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: container2.events.slice(container.events.length),
			uniqueEvents2: [],
		});

		const mergedR = await mergeEventHistories(container, container2);
		assert.deepEqual(mergedR, container2);
		const mergedL = await mergeEventHistories(container2, container);
		assert.deepEqual(mergedL, mergedR);
	});

	it("correctly merges diverged containers when one container is partially folded.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		{
			let container1a = await addNewCredentialEvent(container, "cred2a", "", "");
			let container2a = await addNewCredentialEvent(
				await foldNextEvent(container),
				"cred2b", "", "");

			const mergeBaseL = await findMergeBase(container1a, container2a);
			assert.deepEqual(mergeBaseL, {
				lastEventHash: container.lastEventHash,
				baseState: container.S,
				commonEvents: container.events,
				uniqueEvents1: container1a.events.slice(container.events.length),
				uniqueEvents2: container2a.events.slice(container.events.length - 1),
			});
			const mergeBaseR = await findMergeBase(container2a, container1a);
			assert.deepEqual(mergeBaseR, mergeBaseR);

			const mergedR = await mergeEventHistories(container1a, container2a);
			assert.deepEqual(
				mergedR,
				{
					...container,
					events: [
						...container1a.events,
						{
							...last(container2a.events),
							parentHash: await CurrentSchema.WalletStateOperations.calculateEventHash(last(container1a.events)),
						},
					],
				},
			);

			const mergedL = await mergeEventHistories(container2a, container1a);
			assert.deepEqual(mergedL, mergedR);
		}

		{
			let container1b = await addNewCredentialEvent(
				await foldNextEvent(container),
				"cred2a", "", "");

			let container2b = await addNewCredentialEvent(
				await foldNextEvent(await foldNextEvent(container)),
				"cred2b", "", "");

			const mergeBaseR = await findMergeBase(container1b, container2b);
			assert.deepEqual(mergeBaseR, {
				lastEventHash: container.events[1].parentHash,
				baseState: container1b.S,
				commonEvents: container1b.events.slice(0, container1b.events.length - 1),
				uniqueEvents1: container1b.events.slice(container1b.events.length - 1),
				uniqueEvents2: container2b.events.slice(container1b.events.length - 2),
			});
			const mergedR = await mergeEventHistories(container1b, container2b);
			assert.deepEqual(
				mergedR,
				{
					...container1b,
					events: [
						...container1b.events,
						{
							...last(container2b.events),
							parentHash: await CurrentSchema.WalletStateOperations.calculateEventHash(last(container1b.events)),
						},
					],
				},
			);

			const mergeBaseL = await findMergeBase(container1b, container2b);
			assert.deepEqual(mergeBaseL, mergeBaseR);
			const mergedL = await mergeEventHistories(container2b, container1b);
			assert.deepEqual(mergedL, mergedR);
		}
	});

	it("should successfully fold one event at a time", async () => {
		let container = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		const e1Hash = await CurrentSchema.WalletStateOperations.calculateEventHash(container.events[0]);
		container = await foldOldEventsIntoBaseState(container, -1);
		container = await addNewCredentialEvent(container, "cred2", "", "");
		const e2Hash = await CurrentSchema.WalletStateOperations.calculateEventHash(container.events[0]);

		assert.strictEqual(container.lastEventHash, e1Hash);
		container = await foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});


	it("should successfully fold both events at once", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		container = await addNewCredentialEvent(container, "cred2", "", "");
		const e2Hash = await CurrentSchema.WalletStateOperations.calculateEventHash(container.events[1]);
		container = await foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});

	it("foldOldEventsIntoBaseState does not modify the parent hashes of unfolded events.", async () => {
		const now = Date.now() / 1000;
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();

		container = await addNewCredentialEvent(container, "cred1", "", "");
		last(container.events).timestampSeconds = now - 10;

		container = await addNewCredentialEvent(container, "cred2", "", "");
		last(container.events).timestampSeconds = now + 10;

		const folded = await foldOldEventsIntoBaseState(container, 0);

		assert.deepEqual(folded.events, container.events.slice(1));
		assert.strictEqual(folded.lastEventHash, container.events[1].parentHash);
	});

	it("mergeEventHistories maintains the per-branch order of events.", async () => {
		let container: CurrentSchema.WalletStateContainer = CurrentSchema.WalletStateOperations.initialWalletStateContainer();
		container = await addNewCredentialEvent(container, "cred1", "", "");
		last(container.events).timestampSeconds = 0;
		container = await addNewCredentialEvent(container, "cred2", "", "");
		last(container.events).timestampSeconds = 1;
		container = await addDeleteCredentialEvent(container, (container.events[0] as any).credentialId);
		last(container.events).timestampSeconds = 2;

		let container1 = await addNewCredentialEvent(container, "cred1a", "", "");
		last(container1.events).timestampSeconds = 10;
		container1 = await addNewCredentialEvent(container1, "cred1b", "", "");
		last(container1.events).timestampSeconds = 20;

		let container2 = await addDeleteCredentialEvent(container, (container.events[1] as any).credentialId);
		last(container2.events).timestampSeconds = 15;
		container2 = await addNewCredentialEvent(container2, "cred2x", "", "");
		last(container2.events).timestampSeconds = 16;
		container2 = await addNewCredentialEvent(container2, "cred2y", "", "");
		last(container2.events).timestampSeconds = 25;

		const merged = await mergeEventHistories(container1, container2);
		const expectEvent4 = container1.events[3];
		const expectEvent5 = await CurrentSchema.WalletStateOperations.reparent(container2.events[3], expectEvent4);
		const expectEvent6 = await CurrentSchema.WalletStateOperations.reparent(container2.events[4], expectEvent5);
		const expectEvent7 = await CurrentSchema.WalletStateOperations.reparent(container1.events[4], expectEvent6);
		const expectEvent8 = await CurrentSchema.WalletStateOperations.reparent(container2.events[5], expectEvent7);
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

	it("mergeEventHistories orders events first in ascending order of schemaVersion.", async () => {
		const container: SchemaV1.WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1950214055,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":4048680674,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1458724476,\"parentHash\":\"4cb7a44642b3d07a8b521878fa892a38047db4dc2cdc7997a6366bffe9b234f7\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":1776982089,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3856394471,\"parentHash\":\"8e560270b533d63fc32019eb3b4b4f43c0ad3332cca4f1967e61f82f00fb1fe2\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":4048680674}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		const container1v1: SchemaV1.WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1950214055,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":4048680674,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1458724476,\"parentHash\":\"4cb7a44642b3d07a8b521878fa892a38047db4dc2cdc7997a6366bffe9b234f7\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":1776982089,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3856394471,\"parentHash\":\"8e560270b533d63fc32019eb3b4b4f43c0ad3332cca4f1967e61f82f00fb1fe2\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":4048680674},{\"schemaVersion\":1,\"eventId\":2099289418,\"parentHash\":\"57ffbdbd82ffd7fb0edd8b3d87260dc315c80ecece7f8a2864a9285769acfe3a\",\"timestampSeconds\":10,\"type\":\"new_credential\",\"credentialId\":3764118715,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		let container1 = await addNewCredentialEvent(container1v1, "cred1b", "", "");
		container1.events[4].timestampSeconds = 11;

		const container2v1: SchemaV1.WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1950214055,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":4048680674,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1458724476,\"parentHash\":\"4cb7a44642b3d07a8b521878fa892a38047db4dc2cdc7997a6366bffe9b234f7\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":1776982089,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3856394471,\"parentHash\":\"8e560270b533d63fc32019eb3b4b4f43c0ad3332cca4f1967e61f82f00fb1fe2\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":4048680674},{\"schemaVersion\":1,\"eventId\":2509657177,\"parentHash\":\"57ffbdbd82ffd7fb0edd8b3d87260dc315c80ecece7f8a2864a9285769acfe3a\",\"timestampSeconds\":20,\"type\":\"delete_credential\",\"credentialId\":1776982089},{\"schemaVersion\":1,\"eventId\":3947301554,\"parentHash\":\"416d0b4c67622465202f40891bc9ab618671ca804af3f01bf9d9c18087436620\",\"timestampSeconds\":21,\"type\":\"new_credential\",\"credentialId\":3745183927,\"data\":\"cred2x\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		let container2 = await addNewCredentialEvent(container2v1, "cred2y", "", "");
		container2.events[5].timestampSeconds = 22;

		const merged = await mergeEventHistories(container1, container2);
		const expectEvent4 = container1.events[3];
		const expectEvent5 = await CurrentSchema.WalletStateOperations.reparent(container2.events[3], expectEvent4);
		const expectEvent6 = await CurrentSchema.WalletStateOperations.reparent(container2.events[4], expectEvent5);
		const expectEvent7 = await CurrentSchema.WalletStateOperations.reparent(container1.events[4], expectEvent6);
		const expectEvent8 = await CurrentSchema.WalletStateOperations.reparent(container2.events[5], expectEvent7);
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
