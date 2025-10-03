import { assert, describe, it } from "vitest";
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary, last } from "@/util";
import { findMergeBase, foldNextEvent, foldOldEventsIntoBaseState, mergeEventHistories } from "./WalletStateSchema";
import { WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion1";


/**
	"Fossilize" the given values: encode them as JSON and print an assignment
	statement to the console that parses the value back. The printed statement
	can then be used to replace the construction of the value in tests, in order
	to test backwards compatibility with values created in earlier versions of
	the app.

	To use: Add a statement like `fossilize({ container, container1, container2
	});` to a test, then run the test. Copy the output from the console and
	replace the construction of the values (and the `fossilize` call) with the
	fossilized versions, but keep assertions and further post-processing of the
	value(s). Adjust the `unknown` types to the original types of the serialized
	values.
	*/
export function fossilize(containers: { [name: string]: WalletStateContainer }) {
	Object.keys(containers).forEach(name => {
		const container = containers[name];
		const containerJson = jsonStringifyTaggedBinary(container);
		console.log(`const ${name}: unknown = jsonParseTaggedBinary(${JSON.stringify(containerJson)});`);
	});
}


describe("WalletStateSchemaVersion1", () => {
	it("should successfully apply 'new_credential' events on empty baseState", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":80402279,\"parentHash\":\"\",\"timestampSeconds\":1758139255,\"type\":\"new_credential\",\"credentialId\":383352691,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":341391050,\"parentHash\":\"ed4744cfa91aab9c0e348c966049e114e73dfdb3e7de1ee466260adc17d2ea98\",\"timestampSeconds\":1758139255,\"type\":\"new_credential\",\"credentialId\":627506554,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[{\"credentialId\":383352691,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0,\"batchId\":0},{\"credentialId\":627506554,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0,\"batchId\":0}],\"keypairs\":[],\"presentations\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const s1 = WalletStateOperations.walletStateReducer(container.S, container.events[0]);
		assert.strictEqual(s1.credentials[0].data, "cred1");
		assert(await WalletStateOperations.eventHistoryIsConsistent(container))
		assert.strictEqual(container.S.credentials[1].data, "cred2");
	});

	it("should successfully apply 'delete_credential' event on a baseState that includes credentials", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":3985979274,\"parentHash\":\"\",\"timestampSeconds\":1758139662,\"type\":\"new_credential\",\"credentialId\":3064012123,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":277306176,\"parentHash\":\"dee5fb0d303af2cf9a1ec4a9d8c802a58b140613421556eb3871eace6c617b4f\",\"timestampSeconds\":1758139662,\"type\":\"delete_credential\",\"credentialId\":3064012123}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"keypairs\":[],\"presentations\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		container.S = WalletStateOperations.walletStateReducer(container.S, container.events[1]);
		assert.strictEqual(container.S.credentials.length, 0);
	});

	it("should successfully find the correct point of divergence between two event histories and merge them", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":4095411827,\"parentHash\":\"\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":630265626,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":4150846414,\"parentHash\":\"3f9c69b4f4f030b00a89b4ed3edfc5a3c792ee70b5fc1ff52bfd91a87ef61000\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":890523626,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3217189719,\"parentHash\":\"a7661258871e03cecd5780e16d1bb759e2fa708b350b7218b41888d65f1f29af\",\"timestampSeconds\":1758139777,\"type\":\"delete_credential\",\"credentialId\":630265626}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":4095411827,\"parentHash\":\"\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":630265626,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":4150846414,\"parentHash\":\"3f9c69b4f4f030b00a89b4ed3edfc5a3c792ee70b5fc1ff52bfd91a87ef61000\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":890523626,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3217189719,\"parentHash\":\"a7661258871e03cecd5780e16d1bb759e2fa708b350b7218b41888d65f1f29af\",\"timestampSeconds\":1758139777,\"type\":\"delete_credential\",\"credentialId\":630265626},{\"schemaVersion\":1,\"eventId\":4047450301,\"parentHash\":\"60db32d51af78e6b763fa5c22b3dd9e87598a4400409a5196a1f45e7fe99a63c\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":1468963254,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3855809084,\"parentHash\":\"231904abd9b9e3da41a915ccb5dd4295aec67f93a9ff8d445e35f3053574e5d8\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":561320633,\"data\":\"cred1b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":4095411827,\"parentHash\":\"\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":630265626,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":4150846414,\"parentHash\":\"3f9c69b4f4f030b00a89b4ed3edfc5a3c792ee70b5fc1ff52bfd91a87ef61000\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":890523626,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3217189719,\"parentHash\":\"a7661258871e03cecd5780e16d1bb759e2fa708b350b7218b41888d65f1f29af\",\"timestampSeconds\":1758139777,\"type\":\"delete_credential\",\"credentialId\":630265626},{\"schemaVersion\":1,\"eventId\":3619950786,\"parentHash\":\"60db32d51af78e6b763fa5c22b3dd9e87598a4400409a5196a1f45e7fe99a63c\",\"timestampSeconds\":1758139777,\"type\":\"delete_credential\",\"credentialId\":890523626},{\"schemaVersion\":1,\"eventId\":1128064337,\"parentHash\":\"3f5235d09382d38b23d16554a68e71d5ac7e90561092c5b76027297add41b1f1\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":4173379826,\"data\":\"cred2x\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":2794748144,\"parentHash\":\"b117e0289adcd4e9e376760116f76943f598a15172a59b78de5625f8c3cc720b\",\"timestampSeconds\":1758139777,\"type\":\"new_credential\",\"credentialId\":1956608200,\"data\":\"cred2y\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		const mergeBase = await findMergeBase(container1, container2);
		assert.deepEqual(mergeBase, {
			lastEventHash: container.lastEventHash,
			baseState: container.S,
			commonEvents: container.events,
			uniqueEvents1: container1.events.slice(container.events.length),
			uniqueEvents2: container2.events.slice(container.events.length),
		});

		const merged = await mergeEventHistories(container1, container2);
		const expectMergedEvent2_4 = await WalletStateOperations.reparent(container2.events[4], last(container1.events));
		const expectMergedEvent2_5 = await WalletStateOperations.reparent(container2.events[5], expectMergedEvent2_4);
		const expectMergedEvent2_3 = await WalletStateOperations.reparent(container2.events[3], expectMergedEvent2_5);
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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":782518306,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":2228753648,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":782518306,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":2228753648,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":4233106279,\"parentHash\":\"37baf4e6f06f1e8b0d797e80a1c374c9d50413255a6bf1f3307b62101bdf9297\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":3164469668,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":782518306,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":2228753648,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3310409584,\"parentHash\":\"37baf4e6f06f1e8b0d797e80a1c374c9d50413255a6bf1f3307b62101bdf9297\",\"timestampSeconds\":2,\"type\":\"new_credential\",\"credentialId\":4156780006,\"data\":\"cred2a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":2570755634,\"parentHash\":\"811eac40d87dad22c61c300d7b5fa014ec2c920fbdc046484ce7a0ab7107bc80\",\"timestampSeconds\":3,\"type\":\"new_credential\",\"credentialId\":3164469668,\"data\":\"cred2b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
					await WalletStateOperations.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_credential events by credentialId.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1699947263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3951056821,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3056697948,\"parentHash\":\"56c033059099ea422c07767d6c86a769929692a95e4304de9892d2b94c36b9da\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4139899461,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1699947263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3951056821,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3056697948,\"parentHash\":\"56c033059099ea422c07767d6c86a769929692a95e4304de9892d2b94c36b9da\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4139899461,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1397259759,\"parentHash\":\"00827abc78b3ce14e96526114a3da5ecbb384f2c24fbc92ca189f4ae5fa375ac\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":3951056821}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1699947263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3951056821,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3056697948,\"parentHash\":\"56c033059099ea422c07767d6c86a769929692a95e4304de9892d2b94c36b9da\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4139899461,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3196865046,\"parentHash\":\"00827abc78b3ce14e96526114a3da5ecbb384f2c24fbc92ca189f4ae5fa375ac\",\"timestampSeconds\":3,\"type\":\"delete_credential\",\"credentialId\":3951056821},{\"schemaVersion\":1,\"eventId\":581629353,\"parentHash\":\"5693e18e3b78364dd3f80f250a703aa96772aa147a902552c34cb48492758b2e\",\"timestampSeconds\":4,\"type\":\"delete_credential\",\"credentialId\":4139899461}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
					await WalletStateOperations.reparent(container2.events[3], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_keypair events by kid.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1058812976,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1058812976,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":1488215320,\"parentHash\":\"b08567491ac6f94ecdafe4aa3138b0f82be74aa76e8ea30f8dcf402db8038ddb\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1058812976,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":4174516786,\"parentHash\":\"b08567491ac6f94ecdafe4aa3138b0f82be74aa76e8ea30f8dcf402db8038ddb\",\"timestampSeconds\":2,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did2\"}},{\"schemaVersion\":1,\"eventId\":2563132174,\"parentHash\":\"3ef69e1ef8cb82d8a3b3f8b43bf3b8f7719a96e052f268fd3c2b3df199b8ca0a\",\"timestampSeconds\":3,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did3\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
					await WalletStateOperations.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_keypair events by kid.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1726448878,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":1892871975,\"parentHash\":\"0fe372dfb8cd8dcec3c843be454576eb9392a07d232fb16057b59e8995785b29\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1726448878,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":1892871975,\"parentHash\":\"0fe372dfb8cd8dcec3c843be454576eb9392a07d232fb16057b59e8995785b29\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}},{\"schemaVersion\":1,\"eventId\":509698619,\"parentHash\":\"0422e130eed66f26ab597bd38a90e5bbaa3fd782d162db4cee6f59708c1238e5\",\"timestampSeconds\":2,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did2\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1726448878,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":1892871975,\"parentHash\":\"0fe372dfb8cd8dcec3c843be454576eb9392a07d232fb16057b59e8995785b29\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}},{\"schemaVersion\":1,\"eventId\":2258385734,\"parentHash\":\"0422e130eed66f26ab597bd38a90e5bbaa3fd782d162db4cee6f59708c1238e5\",\"timestampSeconds\":3,\"type\":\"new_keypair\",\"kid\":\"kid3\",\"keypair\":{\"did\":\"did3\"}},{\"schemaVersion\":1,\"eventId\":3046973779,\"parentHash\":\"83b77dc65d5c05e9490fd6fc428a7f49e08f8255c07befc65d757dea7f0a45cc\",\"timestampSeconds\":4,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did4\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
					await WalletStateOperations.reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates new_presentation events by eventId.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2807379839,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2680462135,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2807379839,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2680462135,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":1608553536,\"parentHash\":\"029812f0fbbdbef1af832039bb61a642c81f738144bbc4775fec9ebcceb5953a\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1354016715,\"transactionId\":1,\"data\":\"data1\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2807379839,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2680462135,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":2340925688,\"parentHash\":\"029812f0fbbdbef1af832039bb61a642c81f738144bbc4775fec9ebcceb5953a\",\"timestampSeconds\":2,\"type\":\"new_presentation\",\"presentationId\":608705117,\"transactionId\":2,\"data\":\"data2a\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":1608553536,\"parentHash\":\"effb45781a7437761124d8f2195d818a24ac573a2b3c6f9819fbf4cce3810ce5\",\"timestampSeconds\":3,\"type\":\"new_presentation\",\"presentationId\":1251197648,\"transactionId\":3,\"data\":\"data2b\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
					await WalletStateOperations.reparent(container2.events[1], container1.events[1]),
				],
			});
		}
	});

	it("mergeEventHistories de-duplicates delete_presentation events by eventId.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2001793358,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":3749086304,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":1191692988,\"parentHash\":\"8901b1bc2080ab279d8e8aaed4b9c5b81c1a8ed271e13369ebad3c175634d5b6\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1037785200,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2001793358,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":3749086304,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":1191692988,\"parentHash\":\"8901b1bc2080ab279d8e8aaed4b9c5b81c1a8ed271e13369ebad3c175634d5b6\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1037785200,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":2497980396,\"parentHash\":\"72d5fc5a842eee7cd9db25e8897408b87ae86117d8586d2ca62537a0d16a50d4\",\"timestampSeconds\":2,\"type\":\"delete_presentation\",\"presentationId\":3749086304}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2001793358,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":3749086304,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":1191692988,\"parentHash\":\"8901b1bc2080ab279d8e8aaed4b9c5b81c1a8ed271e13369ebad3c175634d5b6\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1037785200,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":665610029,\"parentHash\":\"72d5fc5a842eee7cd9db25e8897408b87ae86117d8586d2ca62537a0d16a50d4\",\"timestampSeconds\":3,\"type\":\"delete_presentation\",\"presentationId\":3749086304},{\"schemaVersion\":1,\"eventId\":2497980396,\"parentHash\":\"c0a2447fac11d586d5bfe769a69b016f93e510ea7eaac5f105e7af36c886da28\",\"timestampSeconds\":4,\"type\":\"delete_presentation\",\"presentationId\":1037785200}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
					await WalletStateOperations.reparent(container2.events[2], container1.events[2]),
				],
			});
		}
	});

	it("mergeEventHistories overwrites conflicting alter_settings events with the latest one.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":365541108,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":365541108,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}},{\"schemaVersion\":1,\"eventId\":2741640271,\"parentHash\":\"35a0c00db1b6f7cb793d42d0a762bc447e196da4f137d971bd0ae2f5a91d7274\",\"timestampSeconds\":1,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"boo\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":365541108,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}},{\"schemaVersion\":1,\"eventId\":1480569481,\"parentHash\":\"35a0c00db1b6f7cb793d42d0a762bc447e196da4f137d971bd0ae2f5a91d7274\",\"timestampSeconds\":2,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"far\"}},{\"schemaVersion\":1,\"eventId\":2843538917,\"parentHash\":\"b9105273f1f379c4288abd92ceff72e9218f4103c65237c67460d5d3128586f0\",\"timestampSeconds\":3,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"zoo\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1667616520,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758140122}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1667616520,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758140122},{\"schemaVersion\":1,\"eventId\":2156525312,\"parentHash\":\"30194602d32f2a57e7d6458af9e3e761d9327f2161daff9e724bc9409582523d\",\"timestampSeconds\":1,\"type\":\"save_credential_issuance_session\",\"sessionId\":1,\"credentialIssuerIdentifier\":\"iss1\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758140122}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1667616520,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758140122},{\"schemaVersion\":1,\"eventId\":3696612878,\"parentHash\":\"30194602d32f2a57e7d6458af9e3e761d9327f2161daff9e724bc9409582523d\",\"timestampSeconds\":2,\"type\":\"save_credential_issuance_session\",\"sessionId\":2,\"credentialIssuerIdentifier\":\"iss2a\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758140122},{\"schemaVersion\":1,\"eventId\":2156525312,\"parentHash\":\"c3e6de003d0bf42c9a224e6b76cb3d00dd066156c80a1aa84712234abafbb50d\",\"timestampSeconds\":3,\"type\":\"save_credential_issuance_session\",\"sessionId\":3,\"credentialIssuerIdentifier\":\"iss2b\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758140122}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
				await WalletStateOperations.reparent(container2.events[1], container1.events[1]),
			],
		});
	});

	it("resolves a trivial merge by returning the container unchanged.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":830935157,\"parentHash\":\"\",\"timestampSeconds\":1758140152,\"type\":\"new_credential\",\"credentialId\":2065863898,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1009052439,\"parentHash\":\"e605c8173ab993406d4aa2aaa24bd486a699c9f69c0675ce762a1f221ce8badf\",\"timestampSeconds\":1758140152,\"type\":\"delete_credential\",\"credentialId\":2065863898}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":3589333729,\"parentHash\":\"\",\"timestampSeconds\":1758140178,\"type\":\"new_credential\",\"credentialId\":4294348109,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1163430660,\"parentHash\":\"5aa0be3bbd5ff209001ab5603e2a1979b27e276ee9a00ee7e31820c579d7ecac\",\"timestampSeconds\":1758140178,\"type\":\"delete_credential\",\"credentialId\":4294348109}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2031297534,\"parentHash\":\"\",\"timestampSeconds\":1758140205,\"type\":\"new_credential\",\"credentialId\":551019297,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1689313308,\"parentHash\":\"da1e0e299a8dea91fcf439e8b497b05ff7b57474bd852c75a52f514d43e9c925\",\"timestampSeconds\":1758140205,\"type\":\"delete_credential\",\"credentialId\":551019297}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2031297534,\"parentHash\":\"\",\"timestampSeconds\":1758140205,\"type\":\"new_credential\",\"credentialId\":551019297,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1689313308,\"parentHash\":\"da1e0e299a8dea91fcf439e8b497b05ff7b57474bd852c75a52f514d43e9c925\",\"timestampSeconds\":1758140205,\"type\":\"delete_credential\",\"credentialId\":551019297},{\"schemaVersion\":1,\"eventId\":1772855857,\"parentHash\":\"3f5c6b94f130adf774fba9466e4a1729b6722d18fb19e020001ffbc5cc84f715\",\"timestampSeconds\":1758140205,\"type\":\"new_credential\",\"credentialId\":2676590441,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2298427875,\"parentHash\":\"\",\"timestampSeconds\":1758140299,\"type\":\"new_credential\",\"credentialId\":1973359254,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3003092001,\"parentHash\":\"c0cecc7fb748fda8a3a609486805e4bb07ee27e956220a289075149d8a45e8c2\",\"timestampSeconds\":1758140299,\"type\":\"delete_credential\",\"credentialId\":1973359254}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		{
			const container1a: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2298427875,\"parentHash\":\"\",\"timestampSeconds\":1758140299,\"type\":\"new_credential\",\"credentialId\":1973359254,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3003092001,\"parentHash\":\"c0cecc7fb748fda8a3a609486805e4bb07ee27e956220a289075149d8a45e8c2\",\"timestampSeconds\":1758140299,\"type\":\"delete_credential\",\"credentialId\":1973359254},{\"schemaVersion\":1,\"eventId\":699787513,\"parentHash\":\"18bb05b0d0e94420bbf9e500cbc9860dc14d6dd58aac0a7164e4853a7b880bef\",\"timestampSeconds\":1758140316,\"type\":\"new_credential\",\"credentialId\":1858635094,\"data\":\"cred2a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
			const container2a: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"c0cecc7fb748fda8a3a609486805e4bb07ee27e956220a289075149d8a45e8c2\",\"events\":[{\"schemaVersion\":1,\"eventId\":3003092001,\"parentHash\":\"c0cecc7fb748fda8a3a609486805e4bb07ee27e956220a289075149d8a45e8c2\",\"timestampSeconds\":1758140299,\"type\":\"delete_credential\",\"credentialId\":1973359254},{\"schemaVersion\":1,\"eventId\":3327323707,\"parentHash\":\"18bb05b0d0e94420bbf9e500cbc9860dc14d6dd58aac0a7164e4853a7b880bef\",\"timestampSeconds\":1758140316,\"type\":\"new_credential\",\"credentialId\":2613490290,\"data\":\"cred2b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[{\"credentialId\":1973359254,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0,\"batchId\":0}],\"keypairs\":[],\"presentations\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
							parentHash: await WalletStateOperations.calculateEventHash(last(container1a.events)),
						},
					],
				},
			);

			const mergedL = await mergeEventHistories(container2a, container1a);
			assert.deepEqual(mergedL, mergedR);
		}

		{
			const container1b: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"c0cecc7fb748fda8a3a609486805e4bb07ee27e956220a289075149d8a45e8c2\",\"events\":[{\"schemaVersion\":1,\"eventId\":3003092001,\"parentHash\":\"c0cecc7fb748fda8a3a609486805e4bb07ee27e956220a289075149d8a45e8c2\",\"timestampSeconds\":1758140299,\"type\":\"delete_credential\",\"credentialId\":1973359254},{\"schemaVersion\":1,\"eventId\":685465066,\"parentHash\":\"18bb05b0d0e94420bbf9e500cbc9860dc14d6dd58aac0a7164e4853a7b880bef\",\"timestampSeconds\":1758140338,\"type\":\"new_credential\",\"credentialId\":1577629100,\"data\":\"cred2a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[{\"credentialId\":1973359254,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0,\"batchId\":0}],\"keypairs\":[],\"presentations\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
			const container2b: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"18bb05b0d0e94420bbf9e500cbc9860dc14d6dd58aac0a7164e4853a7b880bef\",\"events\":[{\"schemaVersion\":1,\"eventId\":2980878993,\"parentHash\":\"18bb05b0d0e94420bbf9e500cbc9860dc14d6dd58aac0a7164e4853a7b880bef\",\"timestampSeconds\":1758140338,\"type\":\"new_credential\",\"credentialId\":2946513700,\"data\":\"cred2b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"keypairs\":[],\"presentations\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
							parentHash: await WalletStateOperations.calculateEventHash(last(container1b.events)),
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
		const containerv1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2790537656,\"parentHash\":\"\",\"timestampSeconds\":1758140973,\"type\":\"new_credential\",\"credentialId\":3826119239,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3105567709,\"parentHash\":\"b120179d47ff902d87cea70a49b73c24f2cdb1fa41f4af90a4815db4155fbad8\",\"timestampSeconds\":1758140973,\"type\":\"new_credential\",\"credentialId\":3945855528,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		const e1Hash = await WalletStateOperations.calculateEventHash(containerv1.events[0]);
		const e2Hash = await WalletStateOperations.calculateEventHash(containerv1.events[1]);
		let container = await foldNextEvent(containerv1);
		assert.strictEqual(container.lastEventHash, e1Hash);
		container = await foldOldEventsIntoBaseState(container, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});

	it("should successfully fold both events at once", async () => {
		const containerv1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2869811535,\"parentHash\":\"\",\"timestampSeconds\":1758141039,\"type\":\"new_credential\",\"credentialId\":3893673824,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":4148212910,\"parentHash\":\"9efc476407b39f3e4ea38965203bfefd99de3114887cb4635520a5fdbcba74dd\",\"timestampSeconds\":1758141039,\"type\":\"new_credential\",\"credentialId\":1597171040,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		const e2Hash = await WalletStateOperations.calculateEventHash(containerv1.events[1]);
		let container = await foldOldEventsIntoBaseState(containerv1, -1);
		assert.strictEqual(container.lastEventHash, e2Hash);
	});

	it("foldOldEventsIntoBaseState does not modify the parent hashes of unfolded events.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":20540829,\"parentHash\":\"\",\"timestampSeconds\":1758141068.678,\"type\":\"new_credential\",\"credentialId\":2259711124,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1111982049,\"parentHash\":\"2ec37cd81c96cb98963f42eb6aeb297a10e4532cf749238da60f7f760e99a9b0\",\"timestampSeconds\":1758141088.678,\"type\":\"new_credential\",\"credentialId\":265213428,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const now = container.events[0].timestampSeconds + 10;

		const folded = await foldOldEventsIntoBaseState(container, Date.now()/1000 - now);
		assert.deepEqual(folded.events, container.events.slice(1));
		assert.strictEqual(folded.lastEventHash, container.events[1].parentHash);
	});

	it("mergeEventHistories maintains the per-branch order of events.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":482198938,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3191359638,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3320732294,\"parentHash\":\"a69500aceba49f9295322f0b880b2be168eeee7e20c19e24d8eebe1af535b659\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4115269262,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":2400507504,\"parentHash\":\"ad4cfc75d985ae4920f354b37b0f7461e6920eba9d7914806712f25975b2b049\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":3191359638}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":482198938,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3191359638,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3320732294,\"parentHash\":\"a69500aceba49f9295322f0b880b2be168eeee7e20c19e24d8eebe1af535b659\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4115269262,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":2400507504,\"parentHash\":\"ad4cfc75d985ae4920f354b37b0f7461e6920eba9d7914806712f25975b2b049\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":3191359638},{\"schemaVersion\":1,\"eventId\":3962699149,\"parentHash\":\"018fa029851df0b8a4601fb3bde9d053ceba702e5ffdbe6a161504bfbb31f7a4\",\"timestampSeconds\":10,\"type\":\"new_credential\",\"credentialId\":1941419630,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":1540861822,\"parentHash\":\"9af76bbd1f006bcb6f70531a56673d3e245cc6127acc69daa8803447f9b2a56c\",\"timestampSeconds\":20,\"type\":\"new_credential\",\"credentialId\":91249242,\"data\":\"cred1b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":482198938,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3191359638,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3320732294,\"parentHash\":\"a69500aceba49f9295322f0b880b2be168eeee7e20c19e24d8eebe1af535b659\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4115269262,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":2400507504,\"parentHash\":\"ad4cfc75d985ae4920f354b37b0f7461e6920eba9d7914806712f25975b2b049\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":3191359638},{\"schemaVersion\":1,\"eventId\":2505944821,\"parentHash\":\"018fa029851df0b8a4601fb3bde9d053ceba702e5ffdbe6a161504bfbb31f7a4\",\"timestampSeconds\":15,\"type\":\"delete_credential\",\"credentialId\":4115269262},{\"schemaVersion\":1,\"eventId\":3204510370,\"parentHash\":\"bbe87e880f213cb9ae7b217c0b562c33559f345cc6b540a5532c991105bac327\",\"timestampSeconds\":16,\"type\":\"new_credential\",\"credentialId\":2858976839,\"data\":\"cred2x\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":872640181,\"parentHash\":\"65c6e9e11abf8f93279a1ddc17e9f0d05a663a05ae31bbebf3b7ae1a20a040e1\",\"timestampSeconds\":25,\"type\":\"new_credential\",\"credentialId\":1040659246,\"data\":\"cred2y\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		const merged = await mergeEventHistories(container1, container2);
		const expectEvent4 = container1.events[3];
		const expectEvent5 = await WalletStateOperations.reparent(container2.events[3], expectEvent4);
		const expectEvent6 = await WalletStateOperations.reparent(container2.events[4], expectEvent5);
		const expectEvent7 = await WalletStateOperations.reparent(container1.events[4], expectEvent6);
		const expectEvent8 = await WalletStateOperations.reparent(container2.events[5], expectEvent7);
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
