import { assert, describe, it } from "vitest";
import { reparent, WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion3";
import { mergeEventHistories } from "./WalletStateSchema";


describe("WalletStateSchemaVersion3", () => {
	it("mergeEventHistories de-duplicates delete_presentation events by presentationId.", async () => {
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
});
