import { assert, describe, it } from "vitest";
import { findDivergencePoint, WalletSessionEvent, WalletStateContainer, WalletStateOperations } from "./WalletStateOperations";
import { WalletStateUtils } from "./WalletStateUtils";

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
		assert(WalletStateOperations.validateEventHistoryContinuity(container, container.events))

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
		await WalletStateOperations.mergeEventHistories(container1, container2);
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


	it("should successfully add keypair then credential event", async () => {
		let container: WalletStateContainer = WalletStateOperations.initialWalletStateContainer();

		container = await WalletStateOperations.addNewKeypairEvent(
			container,
			"Va_0cgG7S2llllonDKLivUV0psmDZFxAO4gv56NUlcI",
			{
				"kid": "Va_0cgG7S2llllonDKLivUV0psmDZFxAO4gv56NUlcI",
				"did": "did:key:z2dmzD81cgPx8Vki7JbuuMmFYrWPgYoytykUZ3eyqht1j9Kbsrk6s6gk6noLCBUwmLiwFBHZh9kQtvn2ToBjjd5XNwHepvXX1mQizez3AkCSShUoFx1xqccw8fXzX9zDrV5tw1ZMSuZ67n6SveME6ujmbz1nijZN9XdzcHES66UfZBtAH2",
				"alg": "ES256",
				"publicKey": {
					"crv": "P-256",
					"ext": true,
					"key_ops": [],
					"kty": "EC",
					"x": "vfTdFgxl1FHBqKDZw2w05cBKCQc9NTTE7bXmpqMvnGs",
					"y": "0nc_ggdhF0a-ZXJF4pQHAk15YV_81TGR6nfjFUS48bw"
				},
				"wrappedPrivateKey": {
					"privateKey": {
						"0": 209,
						"1": 22,
						"2": 167,
						"3": 67,
						"4": 144,
						"5": 30,
						"6": 207,
						"7": 3,
						"8": 85,
						"9": 140,
						"10": 237,
						"11": 143,
						"12": 201,
						"13": 66,
						"14": 245,
						"15": 125,
						"16": 12,
						"17": 254,
						"18": 74,
						"19": 205,
						"20": 227,
						"21": 114,
						"22": 182,
						"23": 30,
						"24": 227,
						"25": 38,
						"26": 199,
						"27": 105,
						"28": 246,
						"29": 129,
						"30": 137,
						"31": 10,
						"32": 23,
						"33": 3,
						"34": 34,
						"35": 132,
						"36": 70,
						"37": 121,
						"38": 35,
						"39": 7,
						"40": 207,
						"41": 149,
						"42": 124,
						"43": 99,
						"44": 53,
						"45": 19,
						"46": 76,
						"47": 53,
						"48": 183,
						"49": 31,
						"50": 78,
						"51": 106,
						"52": 75,
						"53": 242,
						"54": 40,
						"55": 32,
						"56": 12,
						"57": 205,
						"58": 68,
						"59": 151,
						"60": 70,
						"61": 42,
						"62": 82,
						"63": 128,
						"64": 99,
						"65": 122,
						"66": 144,
						"67": 177,
						"68": 163,
						"69": 155,
						"70": 22,
						"71": 144,
						"72": 156,
						"73": 217,
						"74": 116,
						"75": 150,
						"76": 229,
						"77": 118,
						"78": 95,
						"79": 151,
						"80": 94,
						"81": 193,
						"82": 106,
						"83": 7,
						"84": 65,
						"85": 13,
						"86": 77,
						"87": 207,
						"88": 203,
						"89": 69,
						"90": 102,
						"91": 235,
						"92": 77,
						"93": 243,
						"94": 59,
						"95": 239,
						"96": 112,
						"97": 240,
						"98": 254,
						"99": 10,
						"100": 49,
						"101": 15,
						"102": 149,
						"103": 189,
						"104": 102,
						"105": 27,
						"106": 137,
						"107": 142,
						"108": 6,
						"109": 38,
						"110": 149,
						"111": 54,
						"112": 249,
						"113": 206,
						"114": 65,
						"115": 159,
						"116": 34,
						"117": 90,
						"118": 169,
						"119": 152,
						"120": 195,
						"121": 228,
						"122": 190,
						"123": 230,
						"124": 146,
						"125": 139,
						"126": 176,
						"127": 193,
						"128": 169,
						"129": 30,
						"130": 123,
						"131": 254,
						"132": 91,
						"133": 136,
						"134": 6,
						"135": 236,
						"136": 144,
						"137": 80,
						"138": 61,
						"139": 141,
						"140": 2,
						"141": 187,
						"142": 130,
						"143": 1,
						"144": 96,
						"145": 54,
						"146": 198,
						"147": 160,
						"148": 137,
						"149": 145,
						"150": 107,
						"151": 255,
						"152": 80,
						"153": 70,
						"154": 156,
						"155": 111,
						"156": 50,
						"157": 2,
						"158": 197,
						"159": 150,
						"160": 248,
						"161": 211,
						"162": 251,
						"163": 193,
						"164": 112,
						"165": 197,
						"166": 202,
						"167": 166,
						"168": 41,
						"169": 194,
						"170": 64,
						"171": 194,
						"172": 90,
						"173": 50,
						"174": 151,
						"175": 132,
						"176": 92,
						"177": 60,
						"178": 66,
						"179": 31,
						"180": 239,
						"181": 61,
						"182": 160,
						"183": 178,
						"184": 55,
						"185": 163,
						"186": 171,
						"187": 212,
						"188": 77,
						"189": 125,
						"190": 102,
						"191": 79,
						"192": 168,
						"193": 203,
						"194": 180,
						"195": 163,
						"196": 243,
						"197": 77,
						"198": 18,
						"199": 232,
						"200": 74,
						"201": 103,
						"202": 137,
						"203": 196,
						"204": 43,
						"205": 183,
						"206": 90,
						"207": 106,
						"208": 59,
						"209": 125,
						"210": 149,
						"211": 251,
						"212": 7,
						"213": 225,
						"214": 250,
						"215": 194,
						"216": 106,
						"217": 159,
						"218": 154,
						"219": 60,
						"220": 41,
						"221": 96
					},
					"aesGcmParams": {
						"name": "AES-GCM",
						"iv": {
							"0": 117,
							"1": 206,
							"2": 228,
							"3": 17,
							"4": 191,
							"5": 2,
							"6": 187,
							"7": 42,
							"8": 113,
							"9": 202,
							"10": 176,
							"11": 217
						},
						"additionalData": {},
						"tagLength": 128
					},
					"unwrappedKeyAlgo": {
						"name": "ECDSA",
						"namedCurve": "P-256"
					}
				}
			} as any
		);

		container = await WalletStateOperations.addNewCredentialEvent(
			container,
			"<credential 1>",
			"mso_mdoc",
			"ewweerwer"
		);

		container = await WalletStateOperations.addAlterSettingsEvent(
			container,
			{ x: "12313" }
		);
	});

})
