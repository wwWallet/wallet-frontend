import { HandleAuthorizationRequestError, IOpenID4VP } from "../../interfaces/IOpenID4VP";
import { Verify } from "../../utils/Verify";
import { SDJwt } from "@sd-jwt/core";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { generateRandomIdentifier } from "../../utils/generateRandomIdentifier";
import { base64url, EncryptJWT, importJWK, importX509, jwtVerify } from "jose";
import { OpenID4VPRelyingPartyState, ResponseMode, ResponseModeSchema } from "../../types/OpenID4VPRelyingPartyState";
import { useOpenID4VPRelyingPartyStateRepository } from "../OpenID4VPRelyingPartyStateRepository";
import { extractSAN, getPublicKeyFromB64Cert } from "../../utils/pki";
import axios from "axios";
import { BACKEND_URL, OPENID4VP_SAN_DNS_CHECK_SSL_CERTS, OPENID4VP_SAN_DNS_CHECK } from "../../../config";
import { toBase64 } from "../../../util";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import CredentialsContext from "@/context/CredentialsContext";
import { cborDecode, cborEncode } from "@auth0/mdl/lib/cbor";
import { parse } from "@auth0/mdl";
import { DcqlQuery, DcqlPresentationResult } from 'dcql';
import { JSONPath } from "jsonpath-plus";
import { useTranslation } from 'react-i18next';
import { ParsedTransactionData, parseTransactionData } from "./TransactionData/parseTransactionData";
import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { getLeastUsedCredentialInstance } from "../CredentialBatchHelper";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { TransactionDataResponse } from "./TransactionData/TransactionDataResponse/TransactionDataResponse";

export function useOpenID4VP({ showCredentialSelectionPopup, showStatusPopup, showTransactionDataConsentPopup }: { showCredentialSelectionPopup: (conformantCredentialsMap: any, verifierDomainName: string, verifierPurpose: string, parsedTransactionData?: ParsedTransactionData[]) => Promise<Map<string, number>>, showStatusPopup: (message: { title: string, description: string }, type: 'error' | 'success') => Promise<void>, showTransactionDataConsentPopup: (options: Record<string, unknown>) => Promise<boolean> }): IOpenID4VP {

	const openID4VPRelyingPartyStateRepository = useOpenID4VPRelyingPartyStateRepository();
	const httpProxy = useHttpProxy();
	const { parseCredential } = useContext(CredentialsContext);
	const { keystore, api } = useContext(SessionContext);

	const { t } = useTranslation();
	const { post } = api;

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


	const promptForCredentialSelection = useCallback(
		async (conformantCredentialsMap: any, verifierDomainName: string, verifierPurpose: string, parsedTransactionData: ParsedTransactionData[]): Promise<Map<string, number>> => {
			return showCredentialSelectionPopup(conformantCredentialsMap, verifierDomainName, verifierPurpose, parsedTransactionData);
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

		if (parsedHeader.typ !== "oauth-authz-req+jwt") {
			return { error: HandleAuthorizationRequestError.INVALID_TYP };
		}
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
		vcList: ExtendedVcEntity[],
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
					if ((vc.format === VerifiableCredentialFormat.DC_SDJWT && (descriptor.format === undefined || VerifiableCredentialFormat.DC_SDJWT in descriptor.format)) ||
						(vc.format === VerifiableCredentialFormat.VC_SDJWT && (descriptor.format === undefined || VerifiableCredentialFormat.VC_SDJWT in descriptor.format))) {
						const result = await parseCredential(vc);
						if ('error' in result) continue;
						if (Verify.verifyVcJwtWithDescriptor(descriptor, result.signedClaims)) {
							conformingVcList.push(vc.batchId);
							continue;
						}
					}

					if (vc.format === VerifiableCredentialFormat.MSO_MDOC && VerifiableCredentialFormat.MSO_MDOC in descriptor.format) {
						const credentialBytes = base64url.decode(vc.data);
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

						conformingVcList.push(vc.batchId);
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
				path: field.path[0]
			}));
			mapping.set(descriptor.id, { credentials: conformingVcList, requestedFields: requestedFieldDetails });
		}

		return { mapping, descriptorPurpose };
	}

	async function matchCredentialsToDCQL(vcList: ExtendedVcEntity[], dcqlJson: any, t: any): Promise<
		| { mapping: Map<string, { credentials: number[]; requestedFields: { name: string; purpose: string }[] }>; descriptorPurpose: string }
		| { error: HandleAuthorizationRequestError }
	> {

		const descriptorPurpose = dcqlJson.credential_sets?.[0]?.purpose || t('selectCredentialPopup.purposeNotSpecified');

		// shape all credentials in the wallet
		const shapedCredentials: any[] = [];
		for (const vc of vcList) {
			let shaped: any = { credential_format: vc.format };
			try {
				if (vc.format === VerifiableCredentialFormat.MSO_MDOC) {
					const credentialBytes = base64url.decode(vc.data);
					const issuerSigned = cborDecode(credentialBytes);
					const [header, _, payload, sig] = issuerSigned.get('issuerAuth') as Array<Uint8Array>;
					const decodedIssuerAuthPayload = cborDecode(payload);
					const docType = decodedIssuerAuthPayload.data.get('docType');
					const envelope = {
						version: "1.0",
						documents: [new Map([
							["docType", docType],
							["issuerSigned", issuerSigned],
						])],
						status: 0,
					};
					const mdoc = parse(cborEncode(envelope));
					const [document] = mdoc.documents;

					const nsName = document.issuerSignedNameSpaces[0];
					const nsObject = document.getIssuerNameSpace(nsName);

					shaped = {
						credential_format: vc.format,
						doctype: docType,
						namespaces: {
							[nsName]: nsObject
						},
						batchId: vc.batchId,
						cryptographic_holder_binding: true
					};
				} else {
					// --- SD-JWT shaping ---
					const { signedClaims, error } = await parseCredential(vc);
					if (error) throw error;
					shaped.vct = signedClaims.vct;
					shaped.claims = signedClaims;
					shaped.cryptographic_holder_binding = true;
					shaped.batchId = vc.batchId;
				}
				shapedCredentials.push(shaped);
			} catch (e) {
				console.error('DCQL shaping error for this VC:', e);
			}
		}
		if (shapedCredentials.length === 0) {
			return { error: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
		}
		const parsedQuery = DcqlQuery.parse(dcqlJson);
		DcqlQuery.validate(parsedQuery);
		const result = await DcqlQuery.query(parsedQuery, shapedCredentials);

		const matches = result.credential_matches;

		function hasValidMatch(credId: string): boolean {
			const match = matches[credId];
			if (match?.success === false) {
				match.failed_credentials.map((failedCreds) => {
					if (!failedCreds.meta.success) {
						console.error("DCQL metadata issues: ", failedCreds.meta.issues)
					}
					if (!failedCreds.claims.success) {
						console.error("DCQL failed claims: ", failedCreds.claims)
					}
				})
			}
			return match?.success === true && Array.isArray(match.valid_credentials) && match.valid_credentials.length > 0;
		}

		const satisfied = dcqlJson.credentials.every(cred => hasValidMatch(cred.id));
		// TODO handle case of credential_sets with multiple options
		if (!satisfied) {
			return { error: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
		}

		// Build the mapping for each credential query
		const mapping = new Map<string, { credentials: number[]; requestedFields: { name: string; purpose: string }[] }>();
		for (const credReq of dcqlJson.credentials) {
			const match = result.credential_matches[credReq.id];
			const conforming: number[] = [];
			if (match?.success && match.valid_credentials) {
				for (const vcMatch of match.valid_credentials) {
					// Use input_credential_index to get the shaped credential
					const shaped = shapedCredentials[vcMatch.input_credential_index];
					if (shaped?.batchId) {
						conforming.push(shaped.batchId);
					}
				}
			}
			mapping.set(credReq.id, {
				credentials: conforming,
				requestedFields: !credReq.claims || credReq.claims.length === 0
					? [{ name: t('selectCredentialPopup.allClaimsRequested'), purpose: descriptorPurpose, path: [null] }]
					: credReq.claims.map(cl => ({
						name: cl.id || cl.path.join('.'),
						purpose: descriptorPurpose,
						path: cl.path
					}))
			});
		}

		const allConforming = Array.from(mapping.values()).flatMap(m => m.credentials);
		if (allConforming.length === 0) {
			return { error: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
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
	function generatePresentationFrameForPEXPaths(paths) {
		let result = {};
		paths.forEach(path => {
			if (path.includes("[")) {
				// Use the matchAll method to get all matches
				let matches = [...path.matchAll(/\['(.*?)'\]/g)];

				// grab any dot-keys before the first bracket
				let prefix = path.replace(/\['.*$/, '').replace(/^\$\./, '');
				let current = result;
				if (prefix) {
					prefix.split('.').forEach(key => {
						current[key] = current[key] || {};
						current = current[key];
					});
				}
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

	async function handlePresentationExchangeFlow(S, selectionMap: Map<string, number>, vcEntityList: ExtendedVcEntity[]) {
		const presentationDefinition = S.presentation_definition;
		const response_uri = S.response_uri;
		const client_id = S.client_id;
		const nonce = S.nonce;
		const transaction_data = S.transaction_data;
		let apu = undefined;
		let apv = undefined;

		const allSelectedCredentialBatchIds = Array.from(selectionMap.values());

		const credentialsFilteredByUsage = await Promise.all(allSelectedCredentialBatchIds.map(async (batchId) =>
			getLeastUsedCredentialInstance(batchId, vcEntityList)
		));
		console.log("Sig count: ", credentialsFilteredByUsage[0].sigCount)


		const filteredVCEntities = credentialsFilteredByUsage.filter((vc) =>
			allSelectedCredentialBatchIds.includes(vc.batchId)
		);

		let selectedVCs = [];
		let generatedVPs = [];
		let originalVCs: ExtendedVcEntity[] = [];
		const descriptorMap = [];

		let i = 0;

		for (const [descriptor_id, batchId] of selectionMap) {
			const vcEntity = filteredVCEntities.find(vc => vc.batchId === batchId);
			console.log('vcEntity: ', vcEntity)
			if (vcEntity.format === VerifiableCredentialFormat.DC_SDJWT || vcEntity.format === VerifiableCredentialFormat.VC_SDJWT) {
				const descriptor = presentationDefinition.input_descriptors.find(desc => desc.id === descriptor_id);
				const allPaths = descriptor.constraints.fields
					.map(field => field.path)
					.reduce((accumulator, currentValue) => [...accumulator, ...currentValue]);
				let presentationFrame = generatePresentationFrameForPEXPaths(allPaths);

				const hasher = (data, alg) => {
					const encoded = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
					return crypto.subtle.digest(alg, encoded).then(v => new Uint8Array(v));
				};

				const sdJwt = await SDJwt.fromEncode(vcEntity.data, hasher);
				const presentation = (vcEntity.data.split("~").length - 1) > 1 ?
					await sdJwt.present(presentationFrame, hasher) : vcEntity.data;

				let transactionDataResponseParams;
				if (transaction_data) {
					const [res, err] = await TransactionDataResponse({ descriptor_id: descriptor_id, presentation_definition: presentationDefinition })
						.generateTransactionDataResponse(transaction_data);
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
						format: vcEntity.format,
						path: `$[${i++}]`
					});
				}
				else {
					descriptorMap.push({
						id: descriptor_id,
						format: vcEntity.format,
						path: `$`
					});
				}

				originalVCs.push(vcEntity);

			} else if (vcEntity.format === VerifiableCredentialFormat.MSO_MDOC) {
				console.log("Response uri = ", response_uri);

				const descriptor = presentationDefinition.input_descriptors.filter((desc) => desc.id === descriptor_id)[0];
				const credentialBytes = base64url.decode(vcEntity.data);
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

				const mdocGeneratedNonce = generateRandomIdentifier(8);
				apu = mdocGeneratedNonce;
				apv = nonce;

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

		const credentialIdentifiers = originalVCs.map(vc => vc.batchId);

		return { formData, credentialIdentifiers, generatedVPs, presentationSubmission, filteredVCEntities };
	}

	function convertDcqlToPresentationDefinition(dcql_query) {
		const pdId = crypto.randomUUID();
		const input_descriptors = dcql_query.credentials.map(cred => {
			const descriptorId = cred.meta?.doctype_value!;

			const format: Record<string, any> = {}
			if (cred.format === "mso_mdoc") {
				format.mso_mdoc = { alg: ["ES256", "ES384", "EdDSA"] }
			}

			// build fields paths against the mdoc namespace
			const fields = cred.claims.map(claim => ({
				path: [`$['${cred.meta?.doctype_value}']${claim.path.slice(1).map(p => `['${p}']`).join('')}`],
				intent_to_retain: claim.intent_to_retain ?? false
			}))

			return {
				id: descriptorId,
				format,
				constraints: {
					limit_disclosure: "required",
					fields
				}
			}
		})

		return {
			id: pdId,
			name: `DCQL-converted Presentation Definition`,
			purpose: dcql_query.credential_sets?.[0]?.purpose ?? "No purpose defined",
			input_descriptors
		}
	}

	function generatePresentationFrameForDCQLPaths(paths: string[][]): any {
		const frame = {};

		for (const rawSegments of paths) {
			let current = frame;
			for (let i = 0; i < rawSegments.length; i++) {
				const segment = rawSegments[i];
				if (i === rawSegments.length - 1) {
					current[segment] = true;
				} else {
					current[segment] = current[segment] || {};
					current = current[segment];
				}
			}
		}
		return frame;
	}

	async function handleDCQLFlow(S, selectionMap, vcEntityList: ExtendedVcEntity[]) {
		const { dcql_query, client_id, nonce, response_uri, transaction_data } = S;
		let apu = undefined;
		let apv = undefined;
		let selectedVCs = [];
		let generatedVPs = [];
		let originalVCs = [];

		const allIds = Array.from(selectionMap.values());
		const filtered = vcEntityList.filter(vc =>
			allIds.includes(vc.batchId)
		);

		for (const [selectionKey, batchId] of selectionMap.entries()) {
			const vcEntity = filtered.find(v => v.batchId === batchId);
			if (!vcEntity) continue;

			if (
				vcEntity.format === VerifiableCredentialFormat.VC_SDJWT ||
				vcEntity.format === VerifiableCredentialFormat.DC_SDJWT
			) {
				const descriptor = dcql_query.credentials.find(c => c.id === selectionKey);
				if (!descriptor) {
					throw new Error(`No DCQL descriptor for id ${selectionKey}`);
				}
				const { signedClaims } = await parseCredential(vcEntity);

				let paths: string[][];

				if (!descriptor.claims || descriptor.claims.length === 0) {
					// All claims are requested, get keys from signedClaims
					paths = Object.keys(signedClaims).map(key => [key]);
				} else {
					// Specific claims requested
					paths = descriptor.claims.map(cl => cl.path);
				}

				const frame = generatePresentationFrameForDCQLPaths(paths);
				const hasher = (data, alg) => {
					const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
					return crypto.subtle.digest(alg, bytes).then(buf => new Uint8Array(buf));
				};

				const sdJwt = await SDJwt.fromEncode(vcEntity.data, hasher);
				// TODO handle transaction data
				const presentation = (vcEntity.data.split("~").length - 1) > 1
					? await sdJwt.present(frame, hasher)
					: vcEntity.data;

				const shaped = {
					credential_format: vcEntity.format,
					vct: signedClaims.vct,
					cryptographic_holder_binding: true,
					claims: !descriptor.claims || descriptor.claims.length === 0
						? signedClaims // include all claims
						: Object.fromEntries(
							Object.entries(signedClaims).filter(([k]) =>
								descriptor.claims.some(cl => cl.path.includes(k))
							)
						)
				};
				const presResult = DcqlPresentationResult.fromDcqlPresentation(
					{ [selectionKey]: [shaped] },
					{ dcqlQuery: dcql_query }
				);
				if (!presResult.credential_matches[selectionKey]?.success) {
					throw new Error(`Presentation for '${selectionKey}' did not satisfy DCQL`);
				}

				let transactionDataResponseParams;
				if (transaction_data) {
					const [res, err] = await TransactionDataResponse({ descriptor_id: selectionKey, dcql_query: dcql_query })
						.generateTransactionDataResponse(transaction_data);
					if (err) {
						throw err;
					}
					transactionDataResponseParams = { ...res };
				}

				const { vpjwt } = await keystore.signJwtPresentation(nonce, client_id, [presentation], transactionDataResponseParams);

				selectedVCs.push(presentation);
				generatedVPs.push(vpjwt);
				originalVCs.push(vcEntity);
			}

			else if (vcEntity.format === VerifiableCredentialFormat.MSO_MDOC) {
				// Use DCQL ID (`selectionKey`) to find the descriptor
				const descriptor = dcql_query.credentials.find(c => c.id === selectionKey);
				if (!descriptor) {
					throw new Error(`No DCQL descriptor for id ${selectionKey}`);
				}
				const descriptorId = descriptor.meta?.doctype_value!;
				const credentialBytes = base64url.decode(vcEntity.data);
				const issuerSignedPayload = cborDecode(credentialBytes);

				const mdocStructure = {
					version: '1.0',
					documentErrors: [],
					documents: [new Map([
						['docType', descriptorId],
						['issuerSigned', issuerSignedPayload]
					])],
					status: 0
				};
				const encoded = cborEncode(mdocStructure);
				const mdoc = parse(encoded);
				const mdocGeneratedNonce = generateRandomIdentifier(8);
				apu = mdocGeneratedNonce;
				apv = nonce;

				let dcqlQueryWithClaims;
				if (!descriptor.claims || descriptor.claims.length === 0) {
					dcqlQueryWithClaims = JSON.parse(JSON.stringify(dcql_query));
					const nsName = mdoc.documents[0].issuerSignedNameSpaces[0];
					const ns = mdoc.documents[0].getIssuerNameSpace(nsName);

					const descriptorIndex = dcqlQueryWithClaims.credentials.findIndex(c => c.id === selectionKey);
					if (descriptorIndex !== -1) {
						dcqlQueryWithClaims.credentials[descriptorIndex].claims = Object.keys(ns).map(key => ({
							id: key,
							path: [descriptorId, key]
						}));
					}
				} else {
					dcqlQueryWithClaims = dcql_query
				}

				const presentationDefinition = convertDcqlToPresentationDefinition(dcqlQueryWithClaims);
				const { deviceResponseMDoc } = await keystore.generateDeviceResponse(mdoc, presentationDefinition, apu, apv, client_id, response_uri);
				const encodedDeviceResponse = base64url.encode(deviceResponseMDoc.encode());

				selectedVCs.push(encodedDeviceResponse);
				generatedVPs.push(encodedDeviceResponse);
				originalVCs.push(vcEntity);
			}
		}

		// Always use DCQL query ID (selectionKey) as the key
		const vpTokenObject = Object.fromEntries(
			Array.from(selectionMap.keys()).map((key, idx) => [key, generatedVPs[idx]])
		);

		const presentationSubmission = {
			id: generateRandomIdentifier(8),
			descriptor_map: Array.from(selectionMap.keys()).map((id, idx) => ({ id, path: `$[${idx}]` }))
		};

		const formData = new URLSearchParams();

		if (S.response_mode === ResponseMode.DIRECT_POST_JWT && S.client_metadata.authorization_encrypted_response_alg) {
			const { rp_eph_pub_jwk } = await retrieveKeys(S);
			const rp_eph_pub = await importJWK(rp_eph_pub_jwk, S.client_metadata.authorization_encrypted_response_alg);

			const jwePayload = {
				vp_token: vpTokenObject,
				state: S.state ?? undefined
			};

			const jwe = await new EncryptJWT(jwePayload)
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
			if (S.state) formData.append('state', S.state);
		}

		return { formData, generatedVPs, presentationSubmission, filteredVCEntities: originalVCs };
	}


	const handleAuthorizationRequest = useCallback(async (url: string, vcEntityList: ExtendedVcEntity[]): Promise<{ conformantCredentialsMap: Map<string, any>; verifierDomainName: string, verifierPurpose: string, parsedTransactionData?: ParsedTransactionData } | { error: HandleAuthorizationRequestError }> => {
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

		const client_id_scheme = client_id.split(':')[0];
		if (client_id_scheme !== 'x509_san_dns') {
			return { error: HandleAuthorizationRequestError.NON_SUPPORTED_CLIENT_ID_SCHEME };
		}

		let parsedTransactionData: ParsedTransactionData | null = null;
		if (request_uri) {
			try {
				const result = await handleRequestUri(request_uri, httpProxy);
				if ('error' in result) {
					return result;
				}
				const { payload, parsedHeader } = result;
				client_id = payload.client_id;
				presentation_definition = payload.presentation_definition;
				if (payload.presentation_definition) {
					presentation_definition = payload.presentation_definition;
				} else if (payload.presentation_definition_uri) {
					const presentationDefinitionFetch = await httpProxy.get(payload.presentation_definition_uri, {});
					presentation_definition = presentationDefinitionFetch.data;
				}
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
					parsedTransactionData = parseTransactionData(transaction_data, presentation_definition, dcql_query);
					if (parsedTransactionData === null) {
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


		console.log("VC entity list = ", vcEntityList)
		const vcList = vcEntityList.filter((cred) => cred.instanceId === 0);

		await openID4VPRelyingPartyStateRepository.store(new OpenID4VPRelyingPartyState(
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
		console.log('Presentation Definition: ', presentation_definition);
		console.log('DCQL Query: ', dcql_query);
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
			parsedTransactionData,
		};
	}, [httpProxy, parseCredential, openID4VPRelyingPartyStateRepository]);

	const sendAuthorizationResponse = useCallback(async (selectionMap, vcEntityList) => {
		const S = await openID4VPRelyingPartyStateRepository.retrieve();

		if (!S || S.nonce === "" || S.nonce === sessionStorage.getItem("last_used_nonce")) {
			return {};
		}
		sessionStorage.setItem("last_used_nonce", S.nonce);


		let formData, generatedVPs, presentationSubmission, filteredVCEntities;

		if (S.presentation_definition) {
			({ formData, generatedVPs, presentationSubmission, filteredVCEntities } =
				await handlePresentationExchangeFlow(S, selectionMap, vcEntityList));
		}
		else {
			({ formData, generatedVPs, presentationSubmission, filteredVCEntities } =
				await handleDCQLFlow(S, selectionMap, vcEntityList));
		}

		const transactionId = WalletStateUtils.getRandomUint32();
		const [{ }, newPrivateData, keystoreCommit] = await keystore.addPresentations(generatedVPs.map((vpData, index) => {
			console.log("Presentation: ")

			return {
				transactionId: transactionId,
				data: vpData,
				usedCredentialIds: [filteredVCEntities[index].credentialId],
				audience: S.client_id,
			}
		}));
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();

		const bodyString = formData.toString();
		console.log('bodyString: ', bodyString)
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
	}, [httpProxy, openID4VPRelyingPartyStateRepository, storeVerifiablePresentation, showStatusPopup]);

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
