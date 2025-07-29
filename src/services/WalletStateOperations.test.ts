import { assert, describe, it } from "vitest";
import { findDivergencePoint, WalletSessionEvent, WalletStateContainer, WalletStateOperations } from "./WalletStateOperations";
import { WalletStateUtils } from "./WalletStateUtils";

describe("The WalletStateOperations", () => {
	it("should successfully apply 'new_credential' events on empty baseState", async () => {
		const container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		const e1: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);





		const s1 = WalletStateOperations.walletStateReducer(container.S, e1);

		assert(s1.credentials[0].data === "<credential 1>");
		assert(WalletStateOperations.validateEventHistoryContinuity(container, [e1]))

		const e2: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container,
			"<credential 2>",
			"mso_mdoc",
			""
		);

		container.S = WalletStateOperations.walletStateReducer(s1, e2);
		assert(container.S.credentials[1].data === "<credential 2>");
		assert(WalletStateOperations.validateEventHistoryContinuity(container, container.events))
	});

	it("should successfully apply 'delete_credential' event on a baseState that includes credentials", async () => {
		const container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		const e1: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);




		container.S = WalletStateOperations.walletStateReducer(container.S, e1);

		const e2: WalletSessionEvent = await WalletStateOperations.createDeleteCredentialWalletSessionEvent(
			container,

			(e1 as any).credentialId,
		)

		container.S = WalletStateOperations.walletStateReducer(container.S, e2);
		assert(container.S.credentials.length === 0);
		assert(WalletStateOperations.validateEventHistoryContinuity(container, container.events))
	});

	it("should successfully find the correct point of divergence between two event histories and merge them", async () => {
		const container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		const e1: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);

		container.events.push(e1);

		const e2: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container,
			"<credential 2>",
			"mso_mdoc",
			""
		);

		container.events.push(e2);


		const e3: WalletSessionEvent = await WalletStateOperations.createDeleteCredentialWalletSessionEvent(
			container,
			(e1 as any).credentialId,
		);

		container.events.push(e3);


		assert(WalletStateOperations.validateEventHistoryContinuity(container, container.events))

		const container1: WalletStateContainer = JSON.parse(JSON.stringify(container));


		const e4: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container1,
			"<credential session1-a>",
			"mso_mdoc",
			""
		);

		container1.events.push(e4);


		const e5: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container1,
			"<credential session1-b>",
			"mso_mdoc",
			""
		);


		container1.events.push(e5);

		assert(WalletStateOperations.validateEventHistoryContinuity(container1, container1.events));


		const container2: WalletStateContainer = JSON.parse(JSON.stringify(container));


		const e6: WalletSessionEvent = await WalletStateOperations.createDeleteCredentialWalletSessionEvent(
			container2,
			(e2 as any).credentialId,
		);

		container2.events.push(e6);

		const e7: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container2,
			"<credential session2-x>",
			"mso_mdoc",
			""
		);

		container2.events.push(e7);

		const e8: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container2,
			"<credential session2-y>",
			"mso_mdoc",
			""
		);

		container2.events.push(e8);


		assert(WalletStateOperations.validateEventHistoryContinuity(container2, container2.events));

		const result = findDivergencePoint(container1.events, container2.events);
		// verify that E3 is the actual point of divergence
		assert(await WalletStateUtils.calculateEventHash(result) === await WalletStateUtils.calculateEventHash(e3));
		const mergeRes = await WalletStateOperations.mergeEventHistories(container1.events, container2.events);
		assert(WalletStateOperations.validateEventHistoryContinuity(container1, mergeRes));
	});

	it("should successfully fold one events", async () => {
		const container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		const e1: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			""
		);

		container.events.push(e1);


		const containerChanged = await WalletStateOperations.foldOldEventsIntoBaseState(container, -1);

		const e2: WalletSessionEvent = await WalletStateOperations.createNewCredentialWalletSessionEvent(
			containerChanged,
			"<credential 2>",
			"mso_mdoc",
			""
		);

		containerChanged.events.push(e2);

		assert(containerChanged.lastEventHash === await WalletStateUtils.calculateEventHash(e1));
		assert(WalletStateOperations.validateEventHistoryContinuity(containerChanged, containerChanged.events));


		const containerChanged2 = await WalletStateOperations.foldOldEventsIntoBaseState(containerChanged, -1);
		assert(containerChanged2.lastEventHash === await WalletStateUtils.calculateEventHash(e2));
		assert(WalletStateOperations.validateEventHistoryContinuity(containerChanged2, containerChanged2.events));

	});
})
