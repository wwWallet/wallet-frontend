import { assert, describe, it } from "vitest";
import { reparent, WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion2";
import { mergeEventHistories } from "./WalletStateSchema";


describe("WalletStateSchemaVersion2", () => {
	it("mergeEventHistories de-duplicates new_presentation events by presentationId.", async () => {
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
});
