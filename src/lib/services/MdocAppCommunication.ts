import { IMdocAppCommunication } from "../interfaces/IMdocAppCommunication";
import { DataItem, parse } from "@auth0/mdl";
import { cborDecode, cborEncode, getCborEncodeDecodeOptions, setCborEncodeDecodeOptions } from "@auth0/mdl/lib/cbor";
import { v4 as uuidv4 } from 'uuid';
import { decryptMessage, hexToUint8Array, uint8ArrayToBase64Url, deriveSharedSecret, getKey, uint8ArraytoHexString, getSessionTranscriptBytes, getDeviceEngagement, encryptUint8Array } from "../utils/mdocProtocol";
import { base64url } from "jose";
import { useCallback, useContext, useMemo, useRef } from "react";
import SessionContext from "@/context/SessionContext";
import { toBase64 } from "@/util";
import { generateRandomIdentifier } from "../utils/generateRandomIdentifier";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { WalletStateUtils } from "@/services/WalletStateUtils";

export function useMdocAppCommunication(): IMdocAppCommunication {
	let ephemeralKeyRef = useRef<CryptoKeyPair | null>(null);
	const uuid = uuidv4();
	let deviceEngagementBytesRef = useRef<any>(null);
	let credentialRef = useRef<any>(null);
	let sessionDataEncodedRef = useRef<Buffer | null>(null);
	let fieldsPEXRef = useRef<any[]>([]);
	let sessionTranscriptBytesRef = useRef<Buffer | null>(null);
	let skDeviceRef = useRef<CryptoKey>(null);
	const assumedChunkSize = 512;

	const { keystore, api } = useContext(SessionContext);
	const { post } = api;

	const storeVerifiablePresentation = useCallback(
		async (presentation: string, _presentationSubmission: any, usedCredentialId: number, audience: string) => {
			try {
				const transactionId = WalletStateUtils.getRandomUint32();
				const [{ }, newPrivateData, keystoreCommit] = await keystore.addPresentations([presentation].map((vpData, _index) => {
					console.log("Presentation: ")

					return {
						transactionId: transactionId,
						data: vpData,
						usedCredentialIds: [usedCredentialId],
						audience: audience,
					}
				}));
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
				console.log("Presentations added")

			} catch (e) {
				console.log("Failed to reach server: Presentation history not stored");
			}
		},
		[post]
	);


	const generateEngagementQR = useCallback(async (vcEntity: any) => {
		const keyPair = await crypto.subtle.generateKey(
			{
				name: "ECDH",
				namedCurve: "P-256", // the named curve for P-256
			},
			true, // whether the key is extractable (e.g., can be exported)
			["deriveKey", "deriveBits"] // can be used for signing and verification
		);
		ephemeralKeyRef.current = keyPair;

		const publicKeyJWK = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

		// const uuid =  '00179c7a-eec6-4f88-8646-045fda9ac4d8'

		const deviceEngagement = getDeviceEngagement(uuid, publicKeyJWK);

		const options = getCborEncodeDecodeOptions();
		options.variableMapSize = true;
		setCborEncodeDecodeOptions(options);
		const cbor = cborEncode(deviceEngagement);

		deviceEngagementBytesRef.current = DataItem.fromData(deviceEngagement);
		credentialRef.current = vcEntity;

		return `mdoc:${uint8ArrayToBase64Url(cbor)}`;
	}, [uuid]);

	const startClient = useCallback(async (): Promise<boolean> => {
		/* @ts-ignore */
		if (window.nativeWrapper) {
			/* @ts-ignore */
			await nativeWrapper.bluetoothTerminate(); // Terminate any pending ble connections
			try {
				/* @ts-ignore */
				const client = await window.nativeWrapper.bluetoothCreateClient(uuid);
				return client;
			} catch (e) {
				console.log(e);
				/* @ts-ignore */
				console.log(await nativeWrapper.bluetoothStatus());
				console.log("Could not initialize BLE client");
				return false;
			}
		}
		return false;
	}, [uuid]);

	const getMdocRequest = useCallback(async (): Promise<string[]> => {
		let aggregatedData = [];
		/* @ts-ignore */
		if (window.nativeWrapper) {
			console.log("Created BLE client");
			try {
				let dataReceived = [1];
				while (dataReceived[0] === 1) {
					/* @ts-ignore */
					dataReceived = JSON.parse(await window.nativeWrapper.bluetoothReceiveFromServer());
					// this.assumedChunkSize = Math.max(this.assumedChunkSize, dataReceived.length);
					aggregatedData = [...aggregatedData, ...dataReceived.slice(1)];
				}
			} catch (e) {
				console.log("Error receiving");
				console.log(e);
			}
		}
		console.log('Assumed chunk size: ', assumedChunkSize);
		const sessionMessage = uint8ArraytoHexString(new Uint8Array(aggregatedData));
		const decoded = cborDecode(hexToUint8Array(sessionMessage));
		const readerKey = decoded.get('eReaderKey');
		const verifierData = decoded.get('data');
		const coseKey = cborDecode(new Uint8Array(readerKey.buffer));
		const verifierJWK = {
			kty: "EC",
			alg: "ECDH",
			crv: "P-256",
			x: uint8ArrayToBase64Url(coseKey.get(-2)),
			y: uint8ArrayToBase64Url(coseKey.get(-3))
		}
		const verifierPublicKey = await crypto.subtle.importKey("jwk", verifierJWK, { name: "ECDH", namedCurve: "P-256" }, true, []);
		sessionTranscriptBytesRef.current = getSessionTranscriptBytes(
			deviceEngagementBytesRef.current, // DeviceEngagementBytes
			decoded.get('eReaderKey'), // EReaderKeyBytes
		);
		const zab = await deriveSharedSecret(ephemeralKeyRef.current.privateKey, verifierPublicKey);
		const salt = await crypto.subtle.digest("SHA-256", sessionTranscriptBytesRef.current);
		skDeviceRef.current = await getKey(zab, salt, "SKDevice");
		const skReader = await getKey(zab, salt, "SKReader");
		const iv = new Uint8Array([
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // identifier
			0x00, 0x00, 0x00, 0x01 // message counter
		]);

		let decryptedVerifierData;
		try {
			decryptedVerifierData = await decryptMessage(skReader, iv, verifierData, true);
		} catch (e) {
			console.log(e);
		}
		const fieldKeys: string[] = [];
		if (decryptedVerifierData) {
			const mdocRequestDecoded = cborDecode(decryptedVerifierData);
			const fields: Map<string, boolean> = mdocRequestDecoded.get("docRequests")[0].get("itemsRequest").data.get("nameSpaces").get("eu.europa.ec.eudi.pid.1");

			const fieldsPEX = [];
			fields.forEach((value, key) => {
				fieldKeys.push(key);
				fieldsPEX.push({
					"name": key,
					"path": [
						`$['eu.europa.ec.eudi.pid.1']['${key}']`
					],
					"intent_to_retain": value
				},)
			})
			fieldsPEXRef.current = fieldsPEX;
		}

		return fieldKeys;
	}, [keystore]);

	const sendMdocResponse = useCallback(async (): Promise<void> => {
		const fullPEX = {
			"id": "MdocPID",
			"title": "MDOC PID",
			"description": "Placeholder description",
			"input_descriptors": [
				{
					"id": "eu.europa.ec.eudi.pid.1",
					"format": {
						"mso_mdoc": {
							"alg": [
								"ES256"
							]
						},
					},
					"constraints": {
						"limit_disclosure": "required",
						"fields": fieldsPEXRef.current
					}
				}
			]
		}

		// const presentationDefinition = fullPEX;
		const credentialBytes = base64url.decode(credentialRef.current.credential);
		const issuerSigned = cborDecode(credentialBytes);
		// const descriptor = presentationDefinition.input_descriptors.filter((desc) => desc.id === descriptor_id)[0];
		const descriptor = { "id": "eu.europa.ec.eudi.pid.1" }
		const m = {
			version: '1.0',
			documents: [new Map([
				['docType', descriptor.id],
				['issuerSigned', issuerSigned]
			])],
			status: 0
		};
		const options = getCborEncodeDecodeOptions();
		options.variableMapSize = true;
		setCborEncodeDecodeOptions(options);
		const encoded = cborEncode(m);
		const mdoc = parse(encoded);

		const { deviceResponseMDoc } = await keystore.generateDeviceResponseWithProximity(mdoc, fullPEX, sessionTranscriptBytesRef.current);

		// encrypt mdoc response
		const ivEncryption = new Uint8Array([
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, // identifier
			0x00, 0x00, 0x00, 0x01 // message counter
		]);

		const { ciphertext } = (await encryptUint8Array(skDeviceRef.current, deviceResponseMDoc.encode(), ivEncryption));
		const encryptedMdoc = ciphertext;

		const sessionData = {
			data: new Uint8Array(encryptedMdoc),
			// data: encryptedMdoc,
			status: 20
		}

		sessionDataEncodedRef.current = cborEncode(sessionData);

		if (sessionDataEncodedRef.current) {
			let toSendBytes = Array.from(sessionDataEncodedRef.current);
			while (toSendBytes.length > (assumedChunkSize - 1)) {
				const chunk = [1, ...toSendBytes.slice(0, (assumedChunkSize - 1))]
				/* @ts-ignore */
				await nativeWrapper.bluetoothSendToServer(JSON.stringify(chunk));
				toSendBytes = toSendBytes.slice((assumedChunkSize - 1));
			}
			/* @ts-ignore */
			await nativeWrapper.bluetoothSendToServer(JSON.stringify([0, ...toSendBytes]));

			const presentationSubmission = {
				id: generateRandomIdentifier(8),
				definition_id: fullPEX.id,
				descriptor_map: [
					{
						id: fullPEX.input_descriptors[0].id,
						format: VerifiableCredentialFormat.MSO_MDOC,
						path: `$`
					}
				],
			};

			const presentations = "b64:" + toBase64(new TextEncoder().encode(base64url.encode((deviceResponseMDoc.encode()))));
			await storeVerifiablePresentation(presentations, presentationSubmission, credentialRef.current.credentialId, "Proximity Mode");
		}

		/* @ts-ignore */
		await nativeWrapper.bluetoothTerminate();
		return;
	}, []);

	const terminateSession = useCallback(
		async (): Promise<void> => {
			const sessionData = {
				data: new Uint8Array([]),
				status: 20
			}

			const options = getCborEncodeDecodeOptions();
			options.variableMapSize = true;
			setCborEncodeDecodeOptions(options);
			const sessionDataEncoded = cborEncode(sessionData);
			/* @ts-ignore */
			await nativeWrapper.bluetoothSendToServer(JSON.stringify([0, ...sessionDataEncoded]));

			/* @ts-ignore */
			await nativeWrapper.bluetoothTerminate();
		},
		[],
	);

	return useMemo(
		() => ({
			generateEngagementQR,
			startClient,
			getMdocRequest,
			sendMdocResponse,
			terminateSession
		}),
		[
			generateEngagementQR,
			startClient,
			getMdocRequest,
			sendMdocResponse,
			terminateSession
		]
	);
}
