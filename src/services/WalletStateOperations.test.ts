import { assert, describe, it } from "vitest";
import { findDivergencePoint, WalletSessionEvent, WalletStateContainer, WalletStateOperations } from "./WalletStateOperations";
import { WalletStateUtils } from "./WalletStateUtils";
import { CredentialKeyPair } from "./keystore";

describe("The WalletStateOperations", () => {
	it("should successfully apply 'new_credential' events on empty baseState", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);


		const s1 = WalletStateOperations.walletStateReducer(container.S, container.events[0]);

		assert(s1.credentials[0].data === "<credential 1>");
		assert(await WalletStateOperations.eventHistoryIsConsistent(container))

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 2>",
			"mso_mdoc",
			""
		);

		container.S = WalletStateOperations.walletStateReducer(s1, container.events[1]);
		assert(container.S.credentials[1].data === "<credential 2>");
	});

	it("should successfully apply 'delete_credential' event on a baseState that includes credentials", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);


		container.S = WalletStateOperations.walletStateReducer(container.S, container.events[0]);

		container = await WalletStateOperations.addDeleteCredentialEvent(
			container,

			(container.events[0] as any).credentialId,
		)

		container.S = WalletStateOperations.walletStateReducer(container.S, container.events[1]);
		assert(container.S.credentials.length === 0);
	});

	it("should successfully find the correct point of divergence between two event histories and merge them", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);


		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 2>",
			"mso_mdoc",
			""
		);



		container = await WalletStateOperations.addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);




		let container1: WalletStateContainer = JSON.parse(JSON.stringify(container));


		container1 = await WalletStateOperations.addNewCredentialEvent(
			container1,
			"<credential session1-a>",
			"mso_mdoc",
			""
		);



		container1 = await WalletStateOperations.addNewCredentialEvent(
			container1,
			"<credential session1-b>",
			"mso_mdoc",
			""
		);


		let container2: WalletStateContainer = JSON.parse(JSON.stringify(container));


		container2 = await WalletStateOperations.addDeleteCredentialEvent(
			container2,
			(container2.events[1] as any).credentialId,
		);


		container2 = await WalletStateOperations.addNewCredentialEvent(
			container2,
			"<credential session2-x>",
			"mso_mdoc",
			""
		);


		container2 = await WalletStateOperations.addNewCredentialEvent(
			container2,
			"<credential session2-y>",
			"mso_mdoc",
			""
		);

		const result = findDivergencePoint(container1.events, container2.events);
		// verify that E3 is the actual point of divergence
		assert(await WalletStateUtils.calculateEventHash(result) === await WalletStateUtils.calculateEventHash(container.events[2]));

		const merged = await WalletStateOperations.mergeEventHistories(container1, container2);
		const expectMergedEvent2_4 = {
			...container2.events[4],
			parentHash: await WalletStateUtils.calculateEventHash(container1.events[container1.events.length - 1]),
		};
		const expectMergedEvent2_5 = {
			...container2.events[5],
			parentHash: await WalletStateUtils.calculateEventHash(expectMergedEvent2_4),
		};
		const expectMergedEvent2_3 = {
			...container2.events[3],
			parentHash: await WalletStateUtils.calculateEventHash(expectMergedEvent2_5),
		};
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
		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 0>", "mso_mdoc", "");
		container.events[0].timestampSeconds = 0;

		const container1 = await WalletStateOperations.addNewCredentialEvent(container, "<credential 1a>", "mso_mdoc", "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await WalletStateOperations.addNewCredentialEvent(container, "<credential 2a>", "mso_mdoc", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await WalletStateOperations.addNewCredentialEvent(container2, "<credential 2b>", "mso_mdoc", "");
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
					{
						...container2.events[1],
						parentHash: await WalletStateUtils.calculateEventHash(container1.events[1]),
					},
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_credential events by credentialId.", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 1>", "mso_mdoc", "");
		container.events[0].timestampSeconds = 0;
		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 2>", "mso_mdoc", "");
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
					{
						...container2.events[3],
						parentHash: await WalletStateUtils.calculateEventHash(container1.events[2]),
					},
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
					{
						...container2.events[1],
						parentHash: await WalletStateUtils.calculateEventHash(container1.events[1]),
					},
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
					{
						...container2.events[2],
						parentHash: await WalletStateUtils.calculateEventHash(container1.events[2]),
					},
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
					{
						...container2.events[1],
						parentHash: await WalletStateUtils.calculateEventHash(container1.events[1]),
					},
				],
			});
		}
	});

	it("should successfully fold one event at a time", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);


		const e1Hash = await WalletStateUtils.calculateEventHash(container.events[0]);

		container = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 2>",
			"mso_mdoc",
			""
		);

		const e2Hash = await WalletStateUtils.calculateEventHash(container.events[0]);


		assert(container.lastEventHash === e1Hash);
		container = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);
		assert(container.lastEventHash === e2Hash);


	});


	it("should successfully fold both events at once", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);


		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 2>",
			"mso_mdoc",
			""
		);

		const e2Hash = await WalletStateUtils.calculateEventHash(container.events[1]);


		container = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);
		assert(container.lastEventHash === e2Hash);


	});

	it("foldOldEventsIntoBaseState does not modify the parent hashes of unfolded events.", async () => {
		const now = Date.now() / 1000;
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 1>", "mso_mdoc", "");
		container.events[0].timestampSeconds = now - 10;

		container = await WalletStateOperations.addNewCredentialEvent(container, "<credential 2>", "mso_mdoc", "");
		container.events[1].timestampSeconds = now + 10;

		const folded = await WalletStateOperations.foldOldEventsIntoBaseState(container, 0);

		assert.deepEqual(folded.events, container.events.slice(1));
		assert.strictEqual(folded.lastEventHash, container.events[1].parentHash);
	});

})
