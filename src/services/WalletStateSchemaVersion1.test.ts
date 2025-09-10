import { assert, describe, it } from "vitest";
import { CredentialKeyPair } from "./keystore";
import { last } from "@/util";
import * as SchemaV1 from "./WalletStateSchemaVersion1";
import { calculateEventHash, eventHistoryIsConsistent, findMergeBase, foldNextEvent, foldOldEventsIntoBaseState, mergeEventHistories, reparent } from "./WalletStateSchema";



describe("WalletStateSchemaVersion1", () => {
	it("should successfully apply 'new_credential' events on empty baseState", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		const s1 = SchemaV1.WalletStateOperations.walletStateReducer(container.S, container.events[0]);

		assert.strictEqual(s1.credentials[0].data, "cred1");
		assert(await eventHistoryIsConsistent(container))

		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container.S = SchemaV1.WalletStateOperations.walletStateReducer(s1, container.events[1]);
		assert.strictEqual(container.S.credentials[1].data, "cred2");
	});

	it("should successfully apply 'delete_credential' event on a baseState that includes credentials", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container.S = SchemaV1.WalletStateOperations.walletStateReducer(container.S, container.events[0]);
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container.S = SchemaV1.WalletStateOperations.walletStateReducer(container.S, container.events[1]);
		assert.strictEqual(container.S.credentials.length, 0);
	});

	it("should successfully find the correct point of divergence between two event histories and merge them", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		let container1 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		container1 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container1, "cred1b", "", "");

		let container2 = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[1] as any).credentialId,
		);
		container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container2, "cred2x", "", "");
		container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container2, "cred2y", "", "");

		const mergeBase = await findMergeBase(container1, container2);
		assert.deepEqual(mergeBase, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: container1.events.slice(container.events.length),
			uniqueEvents2: container2.events.slice(container.events.length),
		});

		const merged = await mergeEventHistories(container1, container2);
		const expectMergedEvent2_4 = await reparent(container2.events[4], last(container1.events));
		const expectMergedEvent2_5 = await reparent(container2.events[5], expectMergedEvent2_4);
		const expectMergedEvent2_3 = await reparent(container2.events[3], expectMergedEvent2_5);
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
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred0", "", "");
		last(container.events).timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		last(container1.events).timestampSeconds = 1;
		let container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2a", "", "");
		last(container2.events).timestampSeconds = 2;
		container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container2, "cred2b", "", "");
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
					await reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_credential events by credentialId.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		last(container.events).timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		last(container.events).timestampSeconds = 1;

		const container1 = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		last(container1.events).timestampSeconds = 2;
		let container2 = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		last(container2.events).timestampSeconds = 3;
		container2 = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(container2, (container.events[1] as any).credentialId);
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
					await reparent(container2.events[3], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_keypair events by kid.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		last(container.events).timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		last(container1.events).timestampSeconds = 1;
		let container2 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		last(container2.events).timestampSeconds = 2;
		container2 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container2, "kid1", { did: "did3" } as CredentialKeyPair);
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
					await reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_keypair events by kid.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid0", { did: "did0" } as CredentialKeyPair);
		last(container.events).timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid1", { did: "did1" } as CredentialKeyPair);
		last(container.events).timestampSeconds = 1;

		const container1 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		last(container1.events).timestampSeconds = 2;
		let container2 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container, "kid3", { did: "did3" } as CredentialKeyPair);
		last(container2.events).timestampSeconds = 3;
		container2 = await SchemaV1.WalletStateOperations.addNewKeypairEvent(container2, "kid2", { did: "did4" } as CredentialKeyPair);
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
					await reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_presentation events by eventId.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 0, "data0", [], 0, "");
		last(container.events).timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 1, "data1", [], 0, "");
		last(container1.events).timestampSeconds = 1;
		let container2 = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		last(container2.events).timestampSeconds = 2;
		container2 = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		last(container2.events).timestampSeconds = 3;
		container2.events[2].eventId = container1.events[1].eventId;

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
					await reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_presentation events by eventId.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 1, "", [], 2, "");
		last(container.events).timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewPresentationEvent(container, 1, "", [], 2, "");
		last(container.events).timestampSeconds = 1;

		const container1 = await SchemaV1.WalletStateOperations.addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		last(container1.events).timestampSeconds = 2;
		let container2 = await SchemaV1.WalletStateOperations.addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		last(container2.events).timestampSeconds = 3;
		container2 = await SchemaV1.WalletStateOperations.addDeletePresentationEvent(container2, (container.events[1] as any).presentationId);
		last(container2.events).timestampSeconds = 4;
		(container2.events[3] as any).eventId = (container1.events[2] as any).eventId;

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
					await reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories overwrites conflicting alter_settings events with the latest one.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addAlterSettingsEvent(container, { foo: "bar" });
		last(container.events).timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addAlterSettingsEvent(container, { foo: "boo" });
		last(container1.events).timestampSeconds = 1;
		let container2 = await SchemaV1.WalletStateOperations.addAlterSettingsEvent(container, { foo: "far" });
		last(container2.events).timestampSeconds = 2;
		container2 = await SchemaV1.WalletStateOperations.addAlterSettingsEvent(container2, { foo: "zoo" });
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
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 0, "iss0", "", "", "");
		last(container.events).timestampSeconds = 0;

		const container1 = await SchemaV1.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 1, "iss1", "", "", "");
		last(container1.events).timestampSeconds = 1;
		let container2 = await SchemaV1.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container, 2, "iss2a", "", "", "");
		last(container2.events).timestampSeconds = 2;
		container2 = await SchemaV1.WalletStateOperations.addSaveCredentialIssuanceSessionEvent(container2, 3, "iss2b", "", "", "");
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
				await reparent(container2.events[1], container1.events[1]),
			],
		});
	});

	it("resolves a trivial merge by returning the container unchanged.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
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
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
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
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		let container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");

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
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);

		{
			let container1a = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2a", "", "");
			let container2a = await SchemaV1.WalletStateOperations.addNewCredentialEvent(
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
							parentHash: await SchemaV1.WalletStateOperations.calculateEventHash(last(container1a.events)),
						},
					],
				},
			);

			const mergedL = await mergeEventHistories(container2a, container1a);
			assert.deepEqual(mergedL, mergedR);
		}

		{
			let container1b = await SchemaV1.WalletStateOperations.addNewCredentialEvent(
				await foldNextEvent(container),
				"cred2a", "", "");

			let container2b = await SchemaV1.WalletStateOperations.addNewCredentialEvent(
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
							parentHash: await SchemaV1.WalletStateOperations.calculateEventHash(last(container1b.events)),
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
		let container = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		const e1Hash = await calculateEventHash(container.events[0]);
		container = await foldOldEventsIntoBaseState(container, -1);
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		const e2Hash = await calculateEventHash(container.events[0]);

		assert.strictEqual(container.lastEventHash, e1Hash);
		container = await foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});


	it("should successfully fold both events at once", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		const e2Hash = await calculateEventHash(container.events[1]);
		container = await foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});

	it("foldOldEventsIntoBaseState does not modify the parent hashes of unfolded events.", async () => {
		const now = Date.now() / 1000;
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();

		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		last(container.events).timestampSeconds = now - 10;

		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		last(container.events).timestampSeconds = now + 10;

		const folded = await foldOldEventsIntoBaseState(container, 0);

		assert.deepEqual(folded.events, container.events.slice(1));
		assert.strictEqual(folded.lastEventHash, container.events[1].parentHash);
	});

	it("mergeEventHistories maintains the per-branch order of events.", async () => {
		let container: SchemaV1.WalletStateContainer = SchemaV1.WalletStateOperations.initialWalletStateContainer();
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1", "", "");
		last(container.events).timestampSeconds = 0;
		container = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred2", "", "");
		last(container.events).timestampSeconds = 1;
		container = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(container, (container.events[0] as any).credentialId);
		last(container.events).timestampSeconds = 2;

		let container1 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container, "cred1a", "", "");
		last(container1.events).timestampSeconds = 10;
		container1 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container1, "cred1b", "", "");
		last(container1.events).timestampSeconds = 20;

		let container2 = await SchemaV1.WalletStateOperations.addDeleteCredentialEvent(container, (container.events[1] as any).credentialId);
		last(container2.events).timestampSeconds = 15;
		container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container2, "cred2x", "", "");
		last(container2.events).timestampSeconds = 16;
		container2 = await SchemaV1.WalletStateOperations.addNewCredentialEvent(container2, "cred2y", "", "");
		last(container2.events).timestampSeconds = 25;

		const merged = await mergeEventHistories(container1, container2);
		const expectEvent4 = container1.events[3];
		const expectEvent5 = await reparent(container2.events[3], expectEvent4);
		const expectEvent6 = await reparent(container2.events[4], expectEvent5);
		const expectEvent7 = await reparent(container1.events[4], expectEvent6);
		const expectEvent8 = await reparent(container2.events[5], expectEvent7);
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
