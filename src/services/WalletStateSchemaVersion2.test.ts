import { assert, describe, it } from "vitest";
import { WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion2";
import { mergeEventHistories, SchemaV2 } from "./WalletStateSchema";
import { jsonParseTaggedBinary } from "@/util";


describe("WalletStateSchemaVersion2", () => {

	it("mergeEventHistories de-duplicates new_credential events between v1 and v2 by credentialId.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":36019393,\"parentHash\":\"4713afc02b6f9bdf36ea2afe1891324bd396ac2a2405ecb649079a058bb465a4\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":3809892831,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":2,\"eventId\":272855924,\"parentHash\":\"4713afc02b6f9bdf36ea2afe1891324bd396ac2a2405ecb649079a058bb465a4\",\"timestampSeconds\":2,\"type\":\"new_credential\",\"credentialId\":1587491548,\"data\":\"cred2a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":2,\"eventId\":2279059117,\"parentHash\":\"5e271834ce736bd060819f3e48453e486e8354c79a85986942da8c0cdc182f6f\",\"timestampSeconds\":3,\"type\":\"new_credential\",\"credentialId\":3809892831,\"data\":\"cred2b\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2630264189,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3431808700,\"data\":\"cred1\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":3000440727,\"parentHash\":\"29f35a0926d8df5155bebef1fa529eceb4c5aabace241e8644453c08c4e57088\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":4086911878,\"data\":\"cred2\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":2,\"eventId\":2154670611,\"parentHash\":\"caddd26056d987251608cd0094f824598dd895f34ec4387137699f76fc680767\",\"timestampSeconds\":3,\"type\":\"delete_credential\",\"credentialId\":3431808700},{\"schemaVersion\":2,\"eventId\":2159072870,\"parentHash\":\"0671aa0795762265b37b1d9abab022c95faa7f4debad2b022f7e00f7ffd7c549\",\"timestampSeconds\":4,\"type\":\"delete_credential\",\"credentialId\":4086911878}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2503010263,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":2,\"eventId\":1212142233,\"parentHash\":\"ce123d7acf75eae34b43a2c09fba94199ad6cfb28986a091fab78aa123b16865\",\"timestampSeconds\":2,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did2\"}},{\"schemaVersion\":2,\"eventId\":3633371834,\"parentHash\":\"68cf29d321c4a590e1a11c69cf75000604131697859f406db04126c3fd753954\",\"timestampSeconds\":3,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did3\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1973867650,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_keypair\",\"kid\":\"kid0\",\"keypair\":{\"did\":\"did0\"}},{\"schemaVersion\":1,\"eventId\":2941122128,\"parentHash\":\"2ca2e343531579df64fae2093539696bb0e81a5b3c47d0a284a6175c93f0f537\",\"timestampSeconds\":1,\"type\":\"new_keypair\",\"kid\":\"kid1\",\"keypair\":{\"did\":\"did1\"}},{\"schemaVersion\":2,\"eventId\":2832982387,\"parentHash\":\"407de3bf9cb76c246a851859f0df4845e9fe4f7f42b160e3c2f0fd3a4256a3fb\",\"timestampSeconds\":3,\"type\":\"new_keypair\",\"kid\":\"kid3\",\"keypair\":{\"did\":\"did3\"}},{\"schemaVersion\":2,\"eventId\":2476056213,\"parentHash\":\"1d9fbd73ce8727f01c0c20af1626ea7ee6ae37e174bc25329f664915e4d6b82c\",\"timestampSeconds\":4,\"type\":\"new_keypair\",\"kid\":\"kid2\",\"keypair\":{\"did\":\"did4\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":1978387627,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1206404033,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":1978387627,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1206404033,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":4097442138,\"parentHash\":\"f8c04265a6c8f9b160074da0b6f389211b36900b22f937236937d971a2f0904c\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":489632914,\"transactionId\":1,\"data\":\"data1\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":1978387627,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1206404033,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":3498565965,\"parentHash\":\"f8c04265a6c8f9b160074da0b6f389211b36900b22f937236937d971a2f0904c\",\"timestampSeconds\":2,\"type\":\"new_presentation\",\"presentationId\":3017812904,\"transactionId\":2,\"data\":\"data2a\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":2859244901,\"parentHash\":\"6c7ba2f6faaddb2a786443511df8aba1864968c21345a09e10adcb38a782be73\",\"timestampSeconds\":3,\"type\":\"new_presentation\",\"presentationId\":489632914,\"transactionId\":3,\"data\":\"data2b\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1496605797,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":2384797383,\"transactionId\":0,\"data\":\"data0\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":2867951347,\"parentHash\":\"457a6b5fb565d5a65e8f6a660f3662a746fe9a59df89ccbc31c7eff80a6ed24b\",\"timestampSeconds\":2,\"type\":\"new_presentation\",\"presentationId\":2556122657,\"transactionId\":2,\"data\":\"data2a\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":1937898784,\"parentHash\":\"f8aba0276e97f596dc9ec38a9fd69ada6ad9c6a5ccc395c96ec922f3ba574ebd\",\"timestampSeconds\":3,\"type\":\"new_presentation\",\"presentationId\":684607634,\"transactionId\":3,\"data\":\"data2b\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":0,\"audience\":\"\"}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":3159607347,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":703529455,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":148073756,\"parentHash\":\"ed3542ae21634a19c997e72c4e758b64b5ff1a19adcc559d47bee8970f71db84\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1062109188,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":3159607347,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":703529455,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":148073756,\"parentHash\":\"ed3542ae21634a19c997e72c4e758b64b5ff1a19adcc559d47bee8970f71db84\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1062109188,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":2175044074,\"parentHash\":\"d92569cf4f6b233cd8978b6895e22e061081998ae91cf57ba49cc677968dae60\",\"timestampSeconds\":2,\"type\":\"delete_presentation\",\"presentationId\":703529455}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":2,\"eventId\":3159607347,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":703529455,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":148073756,\"parentHash\":\"ed3542ae21634a19c997e72c4e758b64b5ff1a19adcc559d47bee8970f71db84\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":1062109188,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":1661615711,\"parentHash\":\"d92569cf4f6b233cd8978b6895e22e061081998ae91cf57ba49cc677968dae60\",\"timestampSeconds\":3,\"type\":\"delete_presentation\",\"presentationId\":703529455},{\"schemaVersion\":2,\"eventId\":559749597,\"parentHash\":\"b0d4824f2b79134c5e0126fad16e39b238882e38aa197a90da60b21058c7cd11\",\"timestampSeconds\":4,\"type\":\"delete_presentation\",\"presentationId\":1062109188}],\"S\":{\"schemaVersion\":2,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2428685068,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_presentation\",\"presentationId\":1719887358,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":1,\"eventId\":3505994,\"parentHash\":\"a7df2c017479561c189b098b269d4d0014107b7b8ccd81f16370bd576366a678\",\"timestampSeconds\":1,\"type\":\"new_presentation\",\"presentationId\":853332841,\"transactionId\":1,\"data\":\"\",\"usedCredentialIds\":[],\"presentationTimestampSeconds\":2,\"audience\":\"\"},{\"schemaVersion\":2,\"eventId\":37736415,\"parentHash\":\"0e49950dc11b9e4c0977ae7661601ee33e067da563b04813fe907ceb180a9e02\",\"timestampSeconds\":3,\"type\":\"delete_presentation\",\"presentationId\":1719887358},{\"schemaVersion\":2,\"eventId\":1151374008,\"parentHash\":\"7350cae4645892320ba6cc6858fb2d336d2b89fe03ee5b668405654b6d6c73c2\",\"timestampSeconds\":4,\"type\":\"delete_presentation\",\"presentationId\":853332841}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":3573925921,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"bar\"}},{\"schemaVersion\":2,\"eventId\":964363450,\"parentHash\":\"dd40b27e896926a03b47948bf953f97d336d868764e61f738142d641f7d87094\",\"timestampSeconds\":2,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"far\"}},{\"schemaVersion\":2,\"eventId\":124286468,\"parentHash\":\"64a7c8379ff73b99b33d3fa8879238f2a912fd02b995e88a70ca7a3a8dfaf159\",\"timestampSeconds\":3,\"type\":\"alter_settings\",\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\",\"foo\":\"zoo\"}}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
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
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2605299687,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2605299687,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253},{\"schemaVersion\":1,\"eventId\":3841832280,\"parentHash\":\"97e0fb05d590aa3bed88395f87597ca24effd5d8cf3d64cd3ef84ecf54f22987\",\"timestampSeconds\":1,\"type\":\"save_credential_issuance_session\",\"sessionId\":1,\"credentialIssuerIdentifier\":\"iss1\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container2: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":2605299687,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"save_credential_issuance_session\",\"sessionId\":0,\"credentialIssuerIdentifier\":\"iss0\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1758142253},{\"schemaVersion\":2,\"eventId\":385128184,\"parentHash\":\"97e0fb05d590aa3bed88395f87597ca24effd5d8cf3d64cd3ef84ecf54f22987\",\"timestampSeconds\":2,\"type\":\"save_credential_issuance_session\",\"sessionId\":2,\"credentialIssuerIdentifier\":\"iss2a\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1761746660},{\"schemaVersion\":2,\"eventId\":3841832280,\"parentHash\":\"48b3a0742f3128d1ddb153ea11e274c92654308b7176e6f2fd7ca3a2d332976d\",\"timestampSeconds\":3,\"type\":\"save_credential_issuance_session\",\"sessionId\":3,\"credentialIssuerIdentifier\":\"iss2b\",\"state\":\"\",\"code_verifier\":\"\",\"credentialConfigurationId\":\"\",\"created\":1761746660}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

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
