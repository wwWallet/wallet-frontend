import { HandleAuthorizationRequestError, IOpenID4VP } from "../../interfaces/IOpenID4VP";
import { Verify } from "../../utils/Verify";
import { SDJwt } from "@sd-jwt/core";
import { VerifiableCredentialFormat } from "../../schemas/vc";
import { generateRandomIdentifier } from "../../utils/generateRandomIdentifier";
import { base64url, EncryptJWT, importJWK, importX509, jwtVerify } from "jose";
import { OpenID4VPRelyingPartyState, ResponseMode, ResponseModeSchema } from "../../types/OpenID4VPRelyingPartyState";
import { useOpenID4VPRelyingPartyStateRepository } from "../OpenID4VPRelyingPartyStateRepository";
import { extractSAN, getPublicKeyFromB64Cert } from "../../utils/pki";
import axios from "axios";
import { BACKEND_URL, OPENID4VP_SAN_DNS_CHECK_SSL_CERTS, OPENID4VP_SAN_DNS_CHECK } from "../../../config";
import { useCredentialBatchHelper } from "../CredentialBatchHelper";
import { toBase64 } from "../../../util";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import CredentialsContext from "@/context/CredentialsContext";
import { cborDecode, cborEncode } from "@auth0/mdl/lib/cbor";
import { parse } from "@auth0/mdl";
import {DcqlQuery, DcqlPresentationResult} from 'dcql';
import { JSONPath } from "jsonpath-plus";
import { useTranslation } from 'react-i18next';
import { parseTransactionData } from "./TransactionData/parseTransactionData";
import { ExampleTypeSdJwtVcTransactionDataResponse } from "./TransactionData/ExampleTypeSdJwtVcTransactionDataResponse";

export function useOpenID4VP({ showCredentialSelectionPopup, showStatusPopup, showTransactionDataConsentPopup }: { showCredentialSelectionPopup: (conformantCredentialsMap: any, verifierDomainName: string, verifierPurpose: string) => Promise<Map<string, string>>, showStatusPopup: (message: { title: string, description: string }, type: 'error' | 'success') => Promise<void>, showTransactionDataConsentPopup: (options: Record<string, unknown>) => Promise<boolean> }): IOpenID4VP {

	console.log('useOpenID4VP');
	const openID4VPRelyingPartyStateRepository = useOpenID4VPRelyingPartyStateRepository();
	const httpProxy = useHttpProxy();
	const { parseCredential } = useContext(CredentialsContext);
	const credentialBatchHelper = useCredentialBatchHelper();
	const { keystore, api } = useContext(SessionContext);
	const { t } = useTranslation();
	const { post, get } = api;

	const retrieveKeys = async (S: OpenID4VPRelyingPartyState) => {
		if (S.client_metadata.jwks) {
			const rp_eph_pub_jwk = S.client_metadata.jwks.keys.filter(k => k.use === 'enc')[0];
			if (!rp_eph_pub_jwk) {
				throw new Error("Could not find Relying Party public key for encryption");
			}
			return { rp_eph_pub_jwk };
		}
		if (S.client_metadata.jwks_uri) {
			const response = await axios.get(S.client_metadata.jwks_uri).catch(() => null);
			if (response && 'keys' in response.data) {
				const rp_eph_pub_jwk = response.data.keys.filter((k) => k.use === 'enc')[0];
				if (!rp_eph_pub_jwk) {
					throw new Error("Could not find Relying Party public key for encryption");
				}
				return { rp_eph_pub_jwk };
			}
		}
		throw new Error("Could not find Relying Party public key for encryption");
	};

	const storeVerifiablePresentation = useCallback(
		async (presentation: string, presentationSubmission: any, identifiersOfIncludedCredentials: string[], audience: string) => {
			await post('/storage/vp', {
				presentationIdentifier: generateRandomIdentifier(32),
				presentation,
				presentationSubmission,
				includedVerifiableCredentialIdentifiers: identifiersOfIncludedCredentials,
				audience,
				issuanceDate: new Date().toISOString(),
			});
		},
		[post]
	);

	const getAllStoredVerifiableCredentials = useCallback(async () => {
		const fetchAllCredentials = await get("/storage/vc");
		return { verifiableCredentials: fetchAllCredentials.data.vc_list };
	},
		[get]
	);

	const promptForCredentialSelection = useCallback(
		async (conformantCredentialsMap: any, verifierDomainName: string, verifierPurpose: string): Promise<Map<string, string>> => {
			return showCredentialSelectionPopup(conformantCredentialsMap, verifierDomainName, verifierPurpose);
		},
		[showCredentialSelectionPopup]
	);

	function parseAuthorizationParams(url: string) {
		const authorizationRequest = new URL(url);
		const searchParams = authorizationRequest.searchParams;

		return {
			client_id: searchParams.get('client_id'),
			response_uri: searchParams.get('response_uri'),
			nonce: searchParams.get('nonce'),
			state: searchParams.get('state') as string,
			presentation_definition: searchParams.get('presentation_definition')
				? JSON.parse(searchParams.get('presentation_definition'))
				: null,
			presentation_definition_uri: searchParams.get('presentation_definition_uri'),
			client_metadata: searchParams.get('client_metadata')
				? JSON.parse(searchParams.get('client_metadata'))
				: null,
			response_mode: searchParams.get('response_mode')
				? JSON.parse(searchParams.get('response_mode'))
				: null,
			transaction_data: searchParams.get('transaction_data')
				? JSON.parse(searchParams.get('transaction_data'))
				: null,
			request_uri: searchParams.get('request_uri'),
			dcql_query: searchParams.get('dcql_query')
				? JSON.parse(searchParams.get('dcql_query'))
				: null
		};
	}

	async function resolvePresentationDefinition(presentation_definition_uri: string, httpProxy: any) {
		const result = await httpProxy.get(presentation_definition_uri, {});
		return result.data;
	}

	async function handleRequestUri(request_uri: string, httpProxy: any): Promise<any> {
		const requestUriResponse = await httpProxy.get(request_uri, {});
		const jwt = requestUriResponse.data;
		const [header, payload] = jwt.split('.');
		const parsedHeader = JSON.parse(new TextDecoder().decode(base64url.decode(header)));

		const publicKey = await importX509(getPublicKeyFromB64Cert(parsedHeader.x5c[0]), parsedHeader.alg);
		const verificationResult = await jwtVerify(jwt, publicKey).catch(() => null);
		if (verificationResult == null) {
			console.log("Signature verification of request_uri failed");
			return { error: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER };
		}
		const decodedPayload = JSON.parse(new TextDecoder().decode(base64url.decode(payload)));
		return { payload: decodedPayload, parsedHeader };
	}

	async function matchCredentialsToDefinition(
		vcList: any[],
		presentation_definition: any,
		parseCredential: any,
		t: any
	) {
		const mapping = new Map<string, { credentials: string[]; requestedFields: string[] }>();
		let descriptorPurpose;

		for (const descriptor of presentation_definition.input_descriptors) {
			const conformingVcList = [];
			descriptorPurpose = descriptor.purpose || t('selectCredentialPopup.purposeNotSpecified');

			for (const vc of vcList) {
				try {
					if (
						(vc.format === VerifiableCredentialFormat.SD_JWT_VC || vc.format === VerifiableCredentialFormat.SD_JWT_VC) &&
						(descriptor.format === undefined || VerifiableCredentialFormat.SD_JWT_VC in descriptor.format ||
							VerifiableCredentialFormat.SD_JWT_DC in descriptor.format)
					) {
						const result = await parseCredential(vc.credential);
						if ('error' in result) continue;
						if (Verify.verifyVcJwtWithDescriptor(descriptor, result.signedClaims)) {
							conformingVcList.push(vc.credentialIdentifier);
							continue;
						}
					}

					if (vc.format === VerifiableCredentialFormat.MSO_MDOC && VerifiableCredentialFormat.MSO_MDOC in descriptor.format) {
						const credentialBytes = base64url.decode(vc.credential);
						const issuerSigned = cborDecode(credentialBytes);
						console.log('issuerSigned: ', issuerSigned)

						const m = {
							version: '1.0',
							documents: [
								new Map([
									['docType', descriptor.id],
									['issuerSigned', issuerSigned],
								]),
							],
							status: 0,
						};
						const encoded = cborEncode(m);
						const mdoc = parse(encoded);
						const [document] = mdoc.documents;
						const ns = document.getIssuerNameSpace(document.issuerSignedNameSpaces[0]);
						const json = { [descriptor.id]: ns };

						const fieldsWithValue = descriptor.constraints.fields.map((field) => {
							const values = field.path.map((possiblePath) => JSONPath({ path: possiblePath, json: json })[0]);
							const val = values.find((v) => v !== undefined && v !== null);
							return { field, val };
						});

						if (fieldsWithValue.some((fwv) => fwv.val === undefined)) continue;

						conformingVcList.push(vc.credentialIdentifier);
					}
				} catch (err) {
					console.error("Descriptor matching error", err);
				}
			}

			if (conformingVcList.length === 0) {
				return { error: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
			}

			const requestedFieldDetails = descriptor.constraints.fields.map((field) => ({
				name: field.name || field.path[0],
				purpose: field.purpose || descriptorPurpose,
			}));
			mapping.set(descriptor.id, { credentials: conformingVcList, requestedFields: requestedFieldDetails });
		}

		return { mapping, descriptorPurpose };
	}

	async function matchCredentialsToDCQL(vcList: Array<{ credentialIdentifier: string; credential: string; format: string }>, dcqlJson: any, t: any): Promise<
		| { mapping: Map<string, { credentials: string[]; requestedFields: { name: string; purpose: string }[] }>; descriptorPurpose: string }
		| { error: HandleAuthorizationRequestError }
	> {

		const descriptorPurpose =
			dcqlJson.credential_sets?.[0]?.purpose ||
			t('selectCredentialPopup.purposeNotSpecified');

		console.log('dcqlJson: ', dcqlJson)
		const mapping = new Map<string, { credentials: string[]; requestedFields: { name: string; purpose: string }[] }>();

		for (const credReq of dcqlJson.credentials) {
			const mini = { credential_sets: dcqlJson.credential_sets, credentials: [credReq] };
			const parsed = DcqlQuery.parse(mini);
			console.log('parsed DCQL descriptor:', parsed);
			DcqlQuery.validate(parsed);

			const conforming: string[] = [];

			for (const vc of vcList) {
				if (vc.format !== credReq.format) continue;

				let shaped: any = { credential_format: vc.format };

				try {
					if (vc.format === VerifiableCredentialFormat.MSO_MDOC) {
						const credentialBytes = base64url.decode(vc.credential);
						const issuerSigned = cborDecode(credentialBytes);

						const envelope = {
							version: "1.0",
							documents: [new Map([
								["docType", credReq.meta!.doctype_value!],
								["issuerSigned", issuerSigned],
							])],
							status: 0,
						};
						const encodedEnvelope = cborEncode(envelope);
						const mdoc = parse(encodedEnvelope);
						const [document] = mdoc.documents;

						const nsName = document.issuerSignedNameSpaces[0];
						const nsObject = document.getIssuerNameSpace(nsName);

						shaped = {
							credential_format: vc.format,
							doctype: credReq.meta!.doctype_value!,
							namespaces: {
								[nsName]: nsObject
							}
						};
					} else {
						const { signedClaims, error } = await parseCredential(vc.credential);
						if (error) throw error;
						shaped.vct = signedClaims.vct;
						shaped.claims = {};
						for (const claim of credReq.claims) {
							for (const p of claim.path) {
								console.log('claim of requested claims: ', claim)
								console.log('path of claim: ',  p)
								const v = p.split('.').reduce((o, k) => o?.[k], signedClaims);
								console.log('v: ', v)
								if (v !== undefined) {
									shaped.claims[p] = v;
									console.log('v !== undefined, shaped.claims[p]', shaped.claims[p])
									break;
								}
							}
						}

					}

					const result = await DcqlQuery.query(parsed, [shaped]);
					console.log('RESULT:', result);

					const match = result.credential_matches[credReq.id];
					if (match?.success) {
						conforming.push(vc.credentialIdentifier);
					}
					console.log('shaped VC for DCQL:', shaped);
					console.log('match:', match);
				} catch (e) {
					console.error('DCQL eval error for this VC:', e);
				}
			}

			if (conforming.length === 0) {
				return { error: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
			}

			mapping.set(credReq.id, {
				credentials: conforming,
				requestedFields: credReq.claims.map((cl) => ({
					name: cl.id ? cl.id : cl.path,
					purpose: descriptorPurpose,
				})),
			});
		}

		return { mapping, descriptorPurpose };
	}

	async function verifyHostnameAndCerts(request_uri: string, response_uri: string, parsedHeader: any) {
		if (new URL(request_uri).hostname !== new URL(response_uri).hostname) {
			throw new Error("NONTRUSTED_VERIFIER: Hostname mismatch");
		}

		const altNames = await extractSAN('-----BEGIN CERTIFICATE-----\n' + parsedHeader.x5c[0] + '\n-----END CERTIFICATE-----');

		if (OPENID4VP_SAN_DNS_CHECK && (!altNames || altNames.length === 0)) {
			throw new Error("NONTRUSTED_VERIFIER: SAN not found");
		}

		if (OPENID4VP_SAN_DNS_CHECK && !altNames.includes(new URL(response_uri).hostname)) {
			throw new Error("NONTRUSTED_VERIFIER: Hostname not in SAN");
		}

		if (OPENID4VP_SAN_DNS_CHECK_SSL_CERTS) {
			const response = await axios.post(`${BACKEND_URL}/helper/get-cert`, {
				url: request_uri
			}, {
				timeout: 2500,
				headers: {
					Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken')!)
				}
			}).catch(() => null);

			if (!response) {
				throw new Error("Could not get SSL certificate for " + new URL(request_uri).hostname);
			}
			const { x5c } = response.data;
			if (x5c[0] !== parsedHeader.x5c[0]) {
				throw new Error("x509 SAN DNS: Invalid signer certificate");
			}
		}
	}


	/**
		*
		* @param paths example: [ '$.credentialSubject.image', '$.credentialSubject.grade', '$.credentialSubject.val.x' ]
		* @returns example: { credentialSubject: { image: true, grade: true, val: { x: true } } }
		*/
	function generatePresentationFrameForPaths(paths) {
		let result = {};
		paths.forEach(path => {
			if (path.includes("[")) {
				// Use the matchAll method to get all matches
				let matches = [...path.matchAll(/\['(.*?)'\]/g)];

				// Initialize an empty object to build the result
				let current = result;

				// Iterate over each match and build the nested object
				for (let i = 0; i < matches.length; i++) {
					let key = matches[i][1];
					// If this is the last key, set its value to true
					if (i === matches.length - 1) {
						current[key] = true;
					} else {
						// Otherwise, create a new nested object if it doesn't exist
						current[key] = current[key] || {};
						current = current[key];
					}
				}
			} else {
				let keys = path.replace(/^\$\./, '').split('.');
				// Initialize an empty object to build the result
				let current = result;
				// Iterate over each key and build the nested object
				for (let i = 0; i < keys.length; i++) {
					let key = keys[i];

					// If this is the last key, set its value to true
					if (i === keys.length - 1) {
						current[key] = true;
					} else {
						// Otherwise, create a new nested object if it doesn't exist
						current[key] = current[key] || {};
						current = current[key];
					}
				}
			}
		});
		return result;
	}

	async function handlePresentationExchangeFlow(S, selectionMap, verifiableCredentials) {
		const presentationDefinition = S.presentation_definition;
		const response_uri = S.response_uri;
		const client_id = S.client_id;
		const nonce = S.nonce;
		const transaction_data = S.transaction_data;
		let apu = undefined;
		let apv = undefined;

		const allSelectedCredentialIdentifiers = Array.from(selectionMap.values());

		// returns the credentials with the minimum usages for each credential identifier
		const credentialsFilteredByUsage = await Promise.all(allSelectedCredentialIdentifiers.map(async (credentialIdentifier) => {
			const result = await credentialBatchHelper.getLeastUsedCredential(credentialIdentifier, verifiableCredentials);
			return result.credential;
		}));
		console.log("Sig count: ", credentialsFilteredByUsage[0].sigCount)


		const filteredVCEntities = credentialsFilteredByUsage.filter((vc) =>
			allSelectedCredentialIdentifiers.includes(vc.credentialIdentifier)
		);

		let selectedVCs = [];
		let generatedVPs = [];
		let originalVCs = [];
		const descriptorMap = [];

		let i = 0;

		for (const [descriptor_id, credentialIdentifier] of selectionMap) {
			const vcEntity = filteredVCEntities.find(vc => vc.credentialIdentifier === credentialIdentifier);
			console.log('vcEntity: ', vcEntity)
			if (vcEntity.format === VerifiableCredentialFormat.SD_JWT_VC || vcEntity.format === 'dc+sd-jwt') {
				const descriptor = presentationDefinition.input_descriptors.find(desc => desc.id === descriptor_id);
				const allPaths = descriptor.constraints.fields
					.map(field => field.path)
					.reduce((accumulator, currentValue) => [...accumulator, ...currentValue]);
				let presentationFrame = generatePresentationFrameForPaths(allPaths);

				const hasher = (data, alg) => {
					const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
					return crypto.subtle.digest(alg, encoded).then(v => new Uint8Array(v));
				};

				const sdJwt = await SDJwt.fromEncode(vcEntity.credential, hasher);
				const presentation = (vcEntity.credential.split("~").length - 1) > 1 ?
					await sdJwt.present(presentationFrame, hasher) : vcEntity.credential;

				let transactionDataResponseParams;
				if (transaction_data) {
					const [res, err] = await ExampleTypeSdJwtVcTransactionDataResponse(presentationDefinition, descriptor_id)
						.generateTransactionDataResponseParameters(transaction_data);
					if (err) {
						throw err;
					}
					transactionDataResponseParams = { ...res };
				}

				const { vpjwt } = await keystore.signJwtPresentation(nonce, client_id, [presentation], transactionDataResponseParams);
				selectedVCs.push(presentation);
				generatedVPs.push(vpjwt);

				if (selectionMap.size > 1) {
					descriptorMap.push({
						id: descriptor_id,
						format: VerifiableCredentialFormat.SD_JWT_VC,
						path: `$[${i++}]`
					});
				}
				else {
					descriptorMap.push({
						id: descriptor_id,
						format: VerifiableCredentialFormat.SD_JWT_VC,
						path: `$`
					});
				}

				originalVCs.push(vcEntity);

			} else if (vcEntity.format === VerifiableCredentialFormat.MSO_MDOC) {
				console.log("Response uri = ", response_uri);

				const descriptor = presentationDefinition.input_descriptors.filter((desc) => desc.id === descriptor_id)[0];
				const credentialBytes = base64url.decode(vcEntity.credential);
				const issuerSigned = cborDecode(credentialBytes);

				// According to ISO 23220-4: The value of input descriptor id should be the doctype
				const m = {
					version: '1.0',
					documents: [new Map([
						['docType', descriptor.id],
						['issuerSigned', issuerSigned]
					])],
					status: 0
				};
				const encoded = cborEncode(m);
				const mdoc = parse(encoded);

				const mdocGeneratedNonce = generateRandomIdentifier(8); // mdoc generated nonce
				apu = mdocGeneratedNonce; // no need to base64url encode. jose library handles it
				apv = nonce;  // no need to base64url encode. jose library handles it

				const { deviceResponseMDoc } = await keystore.generateDeviceResponse(mdoc, presentationDefinition, mdocGeneratedNonce, nonce, client_id, response_uri);
				function uint8ArrayToHexString(uint8Array) {
					// @ts-ignore
					return Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0')).join('');
				}
				console.log("Device response in hex format = ", uint8ArrayToHexString(deviceResponseMDoc.encode()));
				const encodedDeviceResponse = base64url.encode(deviceResponseMDoc.encode());
				console.log("B64U Encoded device response = ", encodedDeviceResponse);
				selectedVCs.push(encodedDeviceResponse);
				generatedVPs.push(encodedDeviceResponse);
				descriptorMap.push({
					id: descriptor_id,
					format: VerifiableCredentialFormat.MSO_MDOC,
					path: `$`
				});
				originalVCs.push(vcEntity);
			}
		}

		const presentationSubmission = {
			id: generateRandomIdentifier(8),
			definition_id: S.presentation_definition.id,
			descriptor_map: descriptorMap,
		};

		const formData = new URLSearchParams();

		if (S.response_mode === ResponseMode.DIRECT_POST_JWT && S.client_metadata.authorization_encrypted_response_alg) {
			const { rp_eph_pub_jwk } = await retrieveKeys(S);
			const rp_eph_pub = await importJWK(rp_eph_pub_jwk, S.client_metadata.authorization_encrypted_response_alg);
			const jwe = await new EncryptJWT({
				vp_token: generatedVPs.length === 1 ? generatedVPs[0] : generatedVPs,
				presentation_submission: presentationSubmission,
				state: S.state ?? undefined
			})
				.setKeyManagementParameters({ apu: new TextEncoder().encode(apu), apv: new TextEncoder().encode(apv) })
				.setProtectedHeader({
					alg: S.client_metadata.authorization_encrypted_response_alg,
					enc: S.client_metadata.authorization_encrypted_response_enc,
					kid: rp_eph_pub_jwk.kid
				})
				.encrypt(rp_eph_pub);

			formData.append('response', jwe);
		} else {
			formData.append('vp_token', generatedVPs.length === 1 ? generatedVPs[0] : JSON.stringify(generatedVPs));
			formData.append('presentation_submission', JSON.stringify(presentationSubmission));
			if (S.state) formData.append('state', S.state);
		}

		const credentialIdentifiers = originalVCs.map(vc => vc.credentialIdentifier);

		return { formData, credentialIdentifiers, generatedVPs, presentationSubmission, filteredVCEntities };
	}

	function convertDcqlToPresentationDefinition(dcql_query) {
		const id = crypto.randomUUID(); // or any other unique ID generator
		const input_descriptors = dcql_query.credentials.map(cred => {
			const format = {};
			if (cred.format === "mso_mdoc") {
				format.mso_mdoc = {
					alg: ["ES256", "ES384", "EdDSA"]
				};
			}
			const fields = cred.claims.map(claim => ({
				path: [`$['${cred.meta?.doctype_value}']['${claim.id}']`],
				intent_to_retain: claim.intent_to_retain || false
			}));
			return {
				id: cred.meta?.doctype_value || cred.id,
				format,
				constraints: {
					limit_disclosure: "required",
					fields
				}
			};
		});

		return {
			id,
			name: `DCQL-converted Presentation Definition`,
			purpose: dcql_query.credential_sets?.[0]?.purpose || "No purpose defined",
			input_descriptors
		};
	}

	async function handleDCQLFlow(S, selectionMap, verifiableCredentials) {
		console.log("S: ", S)
		const { dcql_query, client_id, nonce, response_uri } = S;
		console.log('dcql_query: ', dcql_query)
		let apu = undefined;
		let apv = undefined;
		let selectedVCs = [];
		let generatedVPs = [];
		let originalVCs = [];

		const allIds = Array.from(selectionMap.values());
		const filtered = verifiableCredentials.filter(vc =>
			allIds.includes(vc.credentialIdentifier)
		);

		for (const [dcqlId, credId] of selectionMap.entries()) {
			const vcEntity = filtered.find(v => v.credentialIdentifier === credId);
			if (!vcEntity) continue;
			console.log('dcqlId: ', dcqlId);

			if (
				vcEntity.format === VerifiableCredentialFormat.SD_JWT_VC ||
				vcEntity.format === 'dc+sd-jwt'
			) {
				const descriptor = dcql_query.credentials.find(c => c.id === dcqlId);
				if (!descriptor) {
					throw new Error(`No DCQL descriptor for id ${dcqlId}`);
				}

				// Flatten all the claim paths into a simple array of strings
				// e.g. [['first_name'], ['address','street']] → ['first_name','address.street']
				const paths = descriptor.claims
					.flatMap(cl => cl.path.map(p =>
						// join with '.' so our frame builder can split it back
						typeof p === 'string' ? p : p.join('.')
					));

				const frame = generatePresentationFrameForPaths(paths);
				console.log('FRAME: ', frame);
				const hasher = (data, alg) => {
					const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
					return crypto.subtle.digest(alg, bytes)
						.then(buf => new Uint8Array(buf));
				};

				const sdJwt = await SDJwt.fromEncode(vcEntity.credential, hasher);
				const presentation = (vcEntity.credential.split("~").length - 1) > 1 ?
					await sdJwt.present(frame, hasher) : vcEntity.credential;
				console.log('presentation: ', presentation);

				// TODO handle transaction data

				const { signedClaims, error } = await parseCredential(vcEntity.credential);

				const shaped = {
					credential_format: 'dc+sd-jwt' as const,
					vct: signedClaims.vct,
					claims: Object.fromEntries(
						Object.entries(signedClaims).filter(([k, v]) =>
							descriptor.claims.some(cl => cl.path.includes(k))
						)
					)
				};

				const presResult = DcqlPresentationResult.fromDcqlPresentation(
					{ [dcqlId]: shaped },
					{ dcqlQuery: dcql_query }
				);
				if (!presResult.valid_matches[dcqlId]?.success) {
					console.error('Client‐side DCQL validation failed', presResult);
					throw new Error(`Presentation for '${dcqlId}' did not satisfy DCQL`);
				}

				selectedVCs.push(presentation);
				generatedVPs.push(presentation);
				originalVCs.push(vcEntity);

			} else if (vcEntity.format === VerifiableCredentialFormat.MSO_MDOC) {
				const credentialBytes = base64url.decode(vcEntity.credential);
				const issuerSignedPayload = cborDecode(credentialBytes);
				const descriptor = dcql_query.credentials.find(c => c.id === dcqlId);
				if (!descriptor) {
					throw new Error(`No DCQL descriptor for id ${dcqlId}`);
				}

				// Retrieve docType from the descriptor's metadata
				const docTypeFromDescriptor = descriptor.meta?.doctype_value;
				if (!docTypeFromDescriptor) {
					throw new Error(`DCQL descriptor for '${dcqlId}' is missing meta.doctype_value for MSO_MDOC`);
				}

				const mdocStructure = {
					version: '1.0',
					documents: [new Map([
						['docType', docTypeFromDescriptor],
						['issuerSigned', issuerSignedPayload]
					])],
					status: 0
				};
				const encoded = cborEncode(mdocStructure);
				console.log('Attempting to parse MSO_MDOC with docType:', docTypeFromDescriptor);
				const mdoc = parse(encoded);
				console.log('MSO_MDOC parsed successfully for DCQL flow.');
				const mdocGeneratedNonce = generateRandomIdentifier(8);
				const apu = mdocGeneratedNonce;
				const apv = nonce;

				// Convert dcql_query to presentation_definition
				const presentationDefinition = convertDcqlToPresentationDefinition(dcql_query);

				const { deviceResponseMDoc } = await keystore.generateDeviceResponse(mdoc, presentationDefinition, apu, apv, client_id, response_uri);
				function uint8ArrayToHexString(uint8Array) {
					// @ts-ignore
					return Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0')).join('');
				}
				console.log("Device response in hex format = ", uint8ArrayToHexString(deviceResponseMDoc.encode()));
				const encodedDeviceResponse = base64url.encode(deviceResponseMDoc.encode());

				selectedVCs.push(encodedDeviceResponse);
				generatedVPs.push(encodedDeviceResponse);
				originalVCs.push(vcEntity);
			}
		}

		const vpTokenObject: Record<string, string> = {};
		for (let i = 0; i < generatedVPs.length; i++) {
			const dcqlId = Array.from(selectionMap.keys())[i];
			console.log('dcqlId: ', dcqlId)
			vpTokenObject[dcqlId as string] = generatedVPs[i];
		}

		console.log('vpTokenObject: ', vpTokenObject)
		const presentationSubmission = {
			id: generateRandomIdentifier(8),
			descriptor_map: Object.entries(vpTokenObject).map(
				([id], idx) => ({ id, path: `$[${idx}]` })
			)
		};
		console.log('vpTokenObject: ', vpTokenObject)
		console.log('presentationSubmission: ', presentationSubmission)
		const formData = new URLSearchParams();

		if (S.response_mode === ResponseMode.DIRECT_POST_JWT && S.client_metadata.authorization_encrypted_response_alg) {
			const { rp_eph_pub_jwk } = await retrieveKeys(S);
			const rp_eph_pub = await importJWK(rp_eph_pub_jwk, S.client_metadata.authorization_encrypted_response_alg);

			const jwe = await new EncryptJWT({
				vp_token: vpTokenObject,
				state: S.state ?? undefined
			})
				.setKeyManagementParameters({ apu: new TextEncoder().encode(apu), apv: new TextEncoder().encode(apv) })
				.setProtectedHeader({
					alg: S.client_metadata.authorization_encrypted_response_alg,
					enc: S.client_metadata.authorization_encrypted_response_enc,
					kid: rp_eph_pub_jwk.kid
				})
				.encrypt(rp_eph_pub);

			formData.append('response', jwe);
		} else {
			formData.append('vp_token', JSON.stringify(vpTokenObject));
			formData.append('presentation_submission', JSON.stringify(presentationSubmission));
			if (S.state) formData.append('state', S.state);
		}

		const credentialIdentifiers = originalVCs.map(vc => vc.credentialIdentifier);
		return { formData, credentialIdentifiers, generatedVPs, presentationSubmission, filteredVCEntities: originalVCs };
	}


	const handleAuthorizationRequest = useCallback(async (url: string) => {
		let {
			client_id,
			response_uri,
			nonce,
			state,
			presentation_definition,
			presentation_definition_uri,
			client_metadata,
			response_mode,
			transaction_data,
			request_uri,
			dcql_query
		} = parseAuthorizationParams(url);

		if (presentation_definition_uri && !presentation_definition) {
			presentation_definition = await resolvePresentationDefinition(presentation_definition_uri, httpProxy);
		}

		if (request_uri) {
			try {
				const result = await handleRequestUri(request_uri, httpProxy);
				if ('error' in result) {
					return result;
				}
				const { payload, parsedHeader } = result;
				client_id = payload.client_id;
				presentation_definition = payload.presentation_definition;
				dcql_query = payload.dcql_query ?? dcql_query;
				response_uri = payload.response_uri ?? payload.redirect_uri;
				if (response_uri && !response_uri.startsWith("http")) {
					response_uri = `https://${response_uri}`;
				}
				client_metadata = payload.client_metadata;
				response_mode = payload.response_mode ?? response_mode;
				if (payload.transaction_data) {
					console.log("Received transaction data");
					console.log('Transaction data = ', payload.transaction_data)
					transaction_data = payload.transaction_data;
					const result = parseTransactionData(transaction_data, presentation_definition);
					if (result === "invalid_transaction_data") {
						return { error: HandleAuthorizationRequestError.INVALID_TRANSACTION_DATA };
					}
				}
				state = payload.state;
				nonce = payload.nonce;

				await verifyHostnameAndCerts(request_uri, response_uri, parsedHeader);
			} catch (e) {
				console.error("Failed to handle request_uri", e);
				return { error: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER };
			}
		}

		if (sessionStorage.getItem('last_used_nonce') === nonce) {
			return { error: HandleAuthorizationRequestError.OLD_STATE };
		}

		if (!presentation_definition && !dcql_query) {
			return { error: HandleAuthorizationRequestError.MISSING_PRESENTATION_DEFINITION };
		}

		const { error } = ResponseModeSchema.safeParse(response_mode);
		if (error) {
			return { error: HandleAuthorizationRequestError.INVALID_RESPONSE_MODE };
		}

		const { verifiableCredentials } = await getAllStoredVerifiableCredentials();
		const vcList = verifiableCredentials.filter(vc => vc.instanceId === 0);

		await openID4VPRelyingPartyStateRepository.store(
			new OpenID4VPRelyingPartyState(
				presentation_definition,
				nonce,
				response_uri,
				client_id,
				state,
				client_metadata,
				response_mode,
				transaction_data,
				dcql_query
			)
		);

		let matchResult;
		if (presentation_definition) {
			matchResult = await matchCredentialsToDefinition(vcList, presentation_definition, parseCredential, t);
		} else if (dcql_query) {
			matchResult = await matchCredentialsToDCQL(vcList, dcql_query, t);
		}
		if ('error' in matchResult) {
			return { error: matchResult.error };
		}

		const { mapping, descriptorPurpose } = matchResult;
		const verifierDomainName = client_id.includes("http") ? new URL(client_id).hostname : client_id;

		if (mapping.size === 0) {
			console.error("No matching credentials for descriptors");
			throw new Error("Credentials don't satisfy any descriptor");
		}

		return {
			conformantCredentialsMap: mapping,
			verifierDomainName,
			verifierPurpose: descriptorPurpose,
		};
	}, [httpProxy, parseCredential, getAllStoredVerifiableCredentials, openID4VPRelyingPartyStateRepository]);

	const sendAuthorizationResponse = useCallback(async (selectionMap) => {
		const S = await openID4VPRelyingPartyStateRepository.retrieve();

		if (!S || S.nonce === "" || S.nonce === sessionStorage.getItem("last_used_nonce")) {
			return {};
		}
		sessionStorage.setItem("last_used_nonce", S.nonce);

		const { verifiableCredentials } = await getAllStoredVerifiableCredentials();

		let formData, credentialIdentifiers, generatedVPs, presentationSubmission, filteredVCEntities;

		if (S.presentation_definition) {
			({ formData, credentialIdentifiers, generatedVPs, presentationSubmission, filteredVCEntities } =
				await handlePresentationExchangeFlow(S, selectionMap, verifiableCredentials));
		}
		else {
			({ formData, credentialIdentifiers, generatedVPs, presentationSubmission, filteredVCEntities } =
				await handleDCQLFlow(S, selectionMap, verifiableCredentials));
		}

		const presentations = "b64:" + toBase64(new TextEncoder().encode(
			generatedVPs.length === 1 ? generatedVPs[0] : JSON.stringify(generatedVPs)
		));

		const storePresentationPromise = storeVerifiablePresentation(presentations, presentationSubmission, credentialIdentifiers, S.client_id);
		const updateCredentialPromise = filteredVCEntities.map((cred) => credentialBatchHelper.useCredential(cred))
		const updateRepositoryPromise = openID4VPRelyingPartyStateRepository.store(S);

		await Promise.all([storePresentationPromise, ...updateCredentialPromise, updateRepositoryPromise]);

		try {
			const res = await httpProxy.post(S.response_uri, formData.toString(), {
				'Content-Type': 'application/x-www-form-urlencoded'
			});
			const responseData = res.data as { presentation_during_issuance_session?: string, redirect_uri?: string };
			console.log("Direct post response = ", JSON.stringify(res.data));
			if (responseData.presentation_during_issuance_session) {
				return { presentation_during_issuance_session: responseData.presentation_during_issuance_session };
			}
			if (responseData.redirect_uri) {
				return { url: responseData.redirect_uri };
			}
			showStatusPopup({
				title: "Verification succeeded",
				description: "The verification process has been completed",
			}, 'success');
		} catch (err) {
			console.error(err);
			showStatusPopup({
				title: "Error in verification",
				description: "The verification process was not completed successfully",
			}, 'error');
			return {};
		}
	}, [httpProxy, openID4VPRelyingPartyStateRepository, credentialBatchHelper, getAllStoredVerifiableCredentials, storeVerifiablePresentation, showStatusPopup]);

	return useMemo(() => {
		return {
			promptForCredentialSelection,
			handleAuthorizationRequest,
			sendAuthorizationResponse,
		}
	}, [
		promptForCredentialSelection,
		handleAuthorizationRequest,
		sendAuthorizationResponse,
	]);
}
