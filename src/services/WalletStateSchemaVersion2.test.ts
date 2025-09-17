import { assert, describe, it } from "vitest";
import { WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion2";
import { addAlterSettingsEvent, addDeleteCredentialEvent, addDeletePresentationEvent, addNewCredentialEvent, addNewKeypairEvent, addNewPresentationEvent, addSaveCredentialIssuanceSessionEvent, mergeEventHistories, SchemaV2 } from "./WalletStateSchema";
import { CredentialKeyPair } from "./keystore";
import { jsonParseTaggedBinary } from "@/util";


describe("WalletStateSchemaVersion2", () => {

	it("mergeEventHistories de-duplicates new_credential events between v1 and v2 by credentialId.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":36019393,\"parentHash\":\"4713afc02b6f9bdf36ea2afe1891324bd396ac2a2405ecb649079a058bb465a4\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":3809892831,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":2,\"eventId\":851003052,\"parentHash\":\"4713afc02b6f9bdf36ea2afe1891324bd396ac2a2405ecb649079a058bb465a4\",\"timestampSeconds\":2,\"type\":\"new_credential\",\"credentialId\":2449087158,\"data\":\"cred2a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":2,\"eventId\":1691997766,\"parentHash\":\"e1ff8be4ba7b1101643ed86df01c260009ac9df80303739d024bd9196c878add\",\"timestampSeconds\":3,\"type\":\"new_credential\",\"credentialId\":3809892831,\"data\":\"cred2b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2630264189,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3431808700,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3000440727,\"parentHash\":\"29f35a0926d8df5155bebef1fa529eceb4c5aabace241e8644453c08c4e57088\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4086911878,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2630264189,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3431808700,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3000440727,\"parentHash\":\"29f35a0926d8df5155bebef1fa529eceb4c5aabace241e8644453c08c4e57088\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4086911878,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":2103690786,\"parentHash\":\"caddd26056d987251608cd0094f824598dd895f34ec4387137699f76fc680767\",\"timestampSeconds\":2,\"type\":\"delete_credential\",\"credentialId\":3431808700}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2630264189,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3431808700,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3000440727,\"parentHash\":\"29f35a0926d8df5155bebef1fa529eceb4c5aabace241e8644453c08c4e57088\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4086911878,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":2,\"eventId\":649543512,\"parentHash\":\"caddd26056d987251608cd0094f824598dd895f34ec4387137699f76fc680767\",\"timestampSeconds\":3,\"type\":\"delete_credential\",\"credentialId\":3431808700},{\"schemaVersion\":2,\"eventId\":18460958,\"parentHash\":\"b929ad94035552dfe9309394c761f06e9e14896f77a94887762b9b088a0d0567\",\"timestampSeconds\":4,\"type\":\"delete_credential\",\"credentialId\":4086911878}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2503010263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2503010263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":2717899514,\"parentHash\":\"ce123d7acf75eae34b43a2c09fba94199ad6cfb28986a091fab78aa123b16865\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2503010263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":2,\"eventId\":948687591,\"parentHash\":\"ce123d7acf75eae34b43a2c09fba94199ad6cfb28986a091fab78aa123b16865\",\"timestampSeconds\":2,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did2\"}},{\"schemaVersion\":2,\"eventId\":990585338,\"parentHash\":\"b0da13cf0f1a3de701637efef87ddf743123a4133973752997bb89b25d7dec64\",\"timestampSeconds\":3,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did3\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1973867650,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":2941122128,\"parentHash\":\"2ca2e343531579df64fae2093539696bb0e81a5b3c47d0a284a6175c93f0f537\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1973867650,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":2941122128,\"parentHash\":\"2ca2e343531579df64fae2093539696bb0e81a5b3c47d0a284a6175c93f0f537\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}},{\"schemaVersion\":1,\"eventId\":1835533572,\"parentHash\":\"407de3bf9cb76c246a851859f0df4845e9fe4f7f42b160e3c2f0fd3a4256a3fb\",\"timestampSeconds\":2,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did2\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1973867650,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":2941122128,\"parentHash\":\"2ca2e343531579df64fae2093539696bb0e81a5b3c47d0a284a6175c93f0f537\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}},{\"schemaVersion\":2,\"eventId\":2758601010,\"parentHash\":\"407de3bf9cb76c246a851859f0df4845e9fe4f7f42b160e3c2f0fd3a4256a3fb\",\"timestampSeconds\":3,\"type\":\"new_keypair\",\"kid\":\"kid3\",\"keypair\":{\"did\":\"did3\"}},{\"schemaVersion\":2,\"eventId\":608526228,\"parentHash\":\"7f96a1a3f918265d84e6fd60270fcf31d7b9fb41bea2cef64dcd74a467a541fe\",\"timestampSeconds\":4,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did4\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":195911681,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":3540416904,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":195911681,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":3540416904,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":3687570316,\"parentHash\":\"cb7db701577f4e19324060bb7ca210e7ca3fa3459f529a6716e7a1e581c5fcd6\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":29210862,\"transactionId\":1,\"data\":\"data1\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":195911681,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":3540416904,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":3684243313,\"parentHash\":\"cb7db701577f4e19324060bb7ca210e7ca3fa3459f529a6716e7a1e581c5fcd6\",\"timestampSeconds\":2,\"type\":\"new_presentation\",\"presentationId\":1949901939,\"transactionId\":2,\"data\":\"data2a\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":2594809095,\"parentHash\":\"ee81fb5abbb27d9c487fea2528599168b3ba8ac51927a80b221ff7b43e76797a\",\"timestampSeconds\":3,\"type\":\"new_presentation\",\"presentationId\":29210862,\"transactionId\":3,\"data\":\"data2b\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1496605797,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2384797383,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1496605797,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2384797383,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":2867951347,\"parentHash\":\"457a6b5fb565d5a65e8f6a660f3662a746fe9a59df89ccbc31c7eff80a6ed24b\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":684607634,\"transactionId\":1,\"data\":\"data1\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1496605797,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2384797383,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":2867951347,\"parentHash\":\"457a6b5fb565d5a65e8f6a660f3662a746fe9a59df89ccbc31c7eff80a6ed24b\",\"timestampSeconds\":2,\"type\":\"new_presentation\",\"presentationId\":3342755395,\"transactionId\":2,\"data\":\"data2a\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":726088347,\"parentHash\":\"d01c2490b67b03bf93a89a1c659fdadde75c12effed0422fbf077e66ca375f37\",\"timestampSeconds\":3,\"type\":\"new_presentation\",\"presentationId\":684607634,\"transactionId\":3,\"data\":\"data2b\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":3703166374,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":336387034,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":120332346,\"parentHash\":\"921832f033b7185973c9fbfd0cd85e8c607453326640a1deffc0ed76762da75b\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":4000783651,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":3703166374,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":336387034,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":120332346,\"parentHash\":\"921832f033b7185973c9fbfd0cd85e8c607453326640a1deffc0ed76762da75b\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":4000783651,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":3605735950,\"parentHash\":\"d338d917c6dc0f3e9dbfdd53089135a48ca086fee95781b81c3ec9afcf05d469\",\"timestampSeconds\":2,\"type\":\"delete_presentation\",\"presentationId\":336387034}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":3703166374,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":336387034,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":120332346,\"parentHash\":\"921832f033b7185973c9fbfd0cd85e8c607453326640a1deffc0ed76762da75b\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":4000783651,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":13806879,\"parentHash\":\"d338d917c6dc0f3e9dbfdd53089135a48ca086fee95781b81c3ec9afcf05d469\",\"timestampSeconds\":3,\"type\":\"delete_presentation\",\"presentationId\":336387034},{\"schemaVersion\":2,\"eventId\":3674366417,\"parentHash\":\"a56e4708ba10143e98a892968227e20e74bd8b70ef24f4586f4a31e5a3c3c898\",\"timestampSeconds\":4,\"type\":\"delete_presentation\",\"presentationId\":4000783651}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2428685068,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1719887358,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":3505994,\"parentHash\":\"a7df2c017479561c189b098b269d4d0014107b7b8ccd81f16370bd576366a678\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":853332841,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2428685068,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1719887358,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":3505994,\"parentHash\":\"a7df2c017479561c189b098b269d4d0014107b7b8ccd81f16370bd576366a678\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":853332841,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":37736415,\"parentHash\":\"0e49950dc11b9e4c0977ae7661601ee33e067da563b04813fe907ceb180a9e02\",\"timestampSeconds\":2,\"type\":\"delete_presentation\",\"presentationId\":1719887358}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2428685068,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1719887358,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":3505994,\"parentHash\":\"a7df2c017479561c189b098b269d4d0014107b7b8ccd81f16370bd576366a678\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":853332841,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":37736415,\"parentHash\":\"0e49950dc11b9e4c0977ae7661601ee33e067da563b04813fe907ceb180a9e02\",\"timestampSeconds\":3,\"type\":\"delete_presentation\",\"presentationId\":1719887358},{\"schemaVersion\":2,\"eventId\":481545743,\"parentHash\":\"7350cae4645892320ba6cc6858fb2d336d2b89fe03ee5b668405654b6d6c73c2\",\"timestampSeconds\":4,\"type\":\"delete_presentation\",\"presentationId\":853332841}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":3573925921,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":3573925921,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}},{\"schemaVersion\":1,\"eventId\":3420986692,\"parentHash\":\"dd40b27e896926a03b47948bf953f97d336d868764e61f738142d641f7d87094\",\"timestampSeconds\":10,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"boo\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":3573925921,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}},{\"schemaVersion\":2,\"eventId\":2588410059,\"parentHash\":\"dd40b27e896926a03b47948bf953f97d336d868764e61f738142d641f7d87094\",\"timestampSeconds\":2,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"far\"}},{\"schemaVersion\":2,\"eventId\":3641253406,\"parentHash\":\"40a9d1786efe4565bbf61e13c6275c0f455255732ccc0e4b286fba1001801282\",\"timestampSeconds\":3,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"zoo\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2605299687,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2605299687,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253},{\"schemaVersion\":1,\"eventId\":3841832280,\"parentHash\":\"97e0fb05d590aa3bed88395f87597ca24effd5d8cf3d64cd3ef84ecf54f22987\",\"timestampSeconds\":1,\"type\":\"save_credential_issuance_session\",\"sessionId\":1,\"credentialIssuerIdentifier\":\"iss1\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2605299687,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253},{\"schemaVersion\":2,\"eventId\":4164054089,\"parentHash\":\"97e0fb05d590aa3bed88395f87597ca24effd5d8cf3d64cd3ef84ecf54f22987\",\"timestampSeconds\":2,\"type\":\"save_credential_issuance_session\",\"sessionId\":2,\"credentialIssuerIdentifier\":\"iss2a\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758145557},{\"schemaVersion\":2,\"eventId\":3841832280,\"parentHash\":\"1baa253e668de836a83647fd170766ea5227e76a0c7e10fd97eef5ad2de048ff\",\"timestampSeconds\":3,\"type\":\"save_credential_issuance_session\",\"sessionId\":3,\"credentialIssuerIdentifier\":\"iss2b\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758145557}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
