import { assert, describe, it } from "vitest";
import { WalletStateContainer, WalletStateOperations } from "./WalletStateSchemaVersion2";
import { addAlterSettingsEvent, addDeleteCredentialEvent, addDeletePresentationEvent, addNewCredentialEvent, addNewKeypairEvent, addNewPresentationEvent, addSaveCredentialIssuanceSessionEvent, mergeEventHistories, SchemaV2 } from "./WalletStateSchema";
import { CredentialKeyPair } from "./keystore";
import { jsonParseTaggedBinary } from "@/util";


describe("WalletStateSchemaVersion2", () => {

	it("mergeEventHistories de-duplicates new_credential events between v1 and v2 by credentialId.", async () => {
		const container: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");
		const container1: WalletStateContainer = jsonParseTaggedBinary("{\"lastEventHash\":\"\",\"events\":[{\"schemaVersion\":1,\"eventId\":1877231136,\"parentHash\":\"\",\"timestampSeconds\":0,\"type\":\"new_credential\",\"credentialId\":3275482097,\"data\":\"cred0\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0},{\"schemaVersion\":1,\"eventId\":36019393,\"parentHash\":\"4713afc02b6f9bdf36ea2afe1891324bd396ac2a2405ecb649079a058bb465a4\",\"timestampSeconds\":1,\"type\":\"new_credential\",\"credentialId\":3809892831,\"data\":\"cred1a\",\"format\":\"\",\"kid\":\"\",\"batchId\":0,\"credentialIssuerIdentifier\":\"\",\"credentialConfigurationId\":\"\",\"instanceId\":0}],\"S\":{\"schemaVersion\":1,\"credentials\":[],\"presentations\":[],\"keypairs\":[],\"credentialIssuanceSessions\":[],\"settings\":{\"openidRefreshTokenMaxAgeInSeconds\":\"0\"}}}");

		let container2 = await addNewCredentialEvent(container, "cred2a", "", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await addNewCredentialEvent(container2, "cred2b", "", "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).credentialId = (container1.events[1] as any).credentialId;

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

		let container2 = await addDeleteCredentialEvent(
			container,
			(container.events[0] as any).credentialId,
		);
		container2.events[2].timestampSeconds = 3;
		container2 = await addDeleteCredentialEvent(container2, (container.events[1] as any).credentialId);
		container2.events[3].timestampSeconds = 4;

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

		let container2 = await addNewKeypairEvent(container, "kid2", { did: "did2" } as CredentialKeyPair);
		container2.events[1].timestampSeconds = 2;
		container2 = await addNewKeypairEvent(container2, "kid1", { did: "did3" } as CredentialKeyPair);
		container2.events[2].timestampSeconds = 3;

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

		let container2 = await addNewKeypairEvent(container, "kid3", { did: "did3" } as CredentialKeyPair);
		container2.events[2].timestampSeconds = 3;
		container2 = await addNewKeypairEvent(container2, "kid2", { did: "did4" } as CredentialKeyPair);
		container2.events[3].timestampSeconds = 4;

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
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await addNewPresentationEvent(container, 0, "data0", [], 0, "");
		container.events[0].timestampSeconds = 0;

		const container1 = await addNewPresentationEvent(container, 1, "data1", [], 0, "");
		container1.events[1].timestampSeconds = 1;
		let container2 = await addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		container2.events[1].timestampSeconds = 2;
		container2 = await addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).presentationId = (container1.events[1] as any).presentationId;

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

		let container2 = await addNewPresentationEvent(container, 2, "data2a", [], 0, "");
		container2.events[1].timestampSeconds = 2;
		container2.events[1].eventId = container1.events[1].eventId;
		container2 = await addNewPresentationEvent(container2, 3, "data2b", [], 0, "");
		container2.events[2].timestampSeconds = 3;
		(container2.events[2] as any).presentationId = (container1.events[1] as any).presentationId;

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
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();
		container = await addNewPresentationEvent(container, 1, "", [], 2, "");
		container.events[0].timestampSeconds = 0;
		container = await addNewPresentationEvent(container, 1, "", [], 2, "");
		container.events[1].timestampSeconds = 1;

		const container1 = await addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container1.events[2].timestampSeconds = 2;
		let container2 = await addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container2.events[2].timestampSeconds = 3;
		container2 = await addDeletePresentationEvent(container2, (container.events[1] as any).presentationId);
		container2.events[3].timestampSeconds = 4;

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

		let container2 = await addDeletePresentationEvent(
			container,
			(container.events[0] as any).presentationId,
		);
		container2.events[2].timestampSeconds = 3;
		container2.events[2].eventId = container1.events[2].eventId;
		container2 = await addDeletePresentationEvent(container2, (container.events[1] as any).presentationId);
		container2.events[3].timestampSeconds = 4;

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

		const defaultSettings: SchemaV2.WalletStateSettings = { openidRefreshTokenMaxAgeInSeconds: '0' };
		let container2 = await addAlterSettingsEvent(container, { ...defaultSettings, foo: "far" });
		container2.events[1].timestampSeconds = 2;
		container2 = await addAlterSettingsEvent(container2, { ...defaultSettings, foo: "zoo" });
		container2.events[2].timestampSeconds = 3;
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

		let container2 = await addSaveCredentialIssuanceSessionEvent(container, 2, "iss2a", "", "", "");
		container2.events[1].timestampSeconds = 2;
		container2 = await addSaveCredentialIssuanceSessionEvent(container2, 3, "iss2b", "", "", "");
		container2.events[2].timestampSeconds = 3;
		container2.events[2].eventId = container1.events[1].eventId;

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
