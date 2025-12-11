import { HandleAuthorizationRequestError, IOpenID4VP } from "../../interfaces/IOpenID4VP";
import { SDJwt } from "@sd-jwt/core";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { generateRandomIdentifier } from "../../utils/generateRandomIdentifier";
import { base64url, EncryptJWT, importJWK, importX509, jwtVerify } from "jose";
import { OpenID4VPRelyingPartyState, ResponseMode, ResponseModeSchema } from "../../types/OpenID4VPRelyingPartyState";
import { useOpenID4VPRelyingPartyStateRepository } from "../OpenID4VPRelyingPartyStateRepository";
import { extractSAN, getPublicKeyFromB64Cert } from "../../utils/pki";
import axios from "axios";
import { BACKEND_URL, OPENID4VP_SAN_DNS_CHECK_SSL_CERTS, OPENID4VP_SAN_DNS_CHECK } from "../../../config";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import CredentialsContext from "@/context/CredentialsContext";
import { cborDecode, cborEncode } from "@auth0/mdl/lib/cbor";
import { parse } from "@auth0/mdl";
import { DcqlQuery, DcqlPresentationResult } from 'dcql';
import { useTranslation } from 'react-i18next';
import { ParsedTransactionData, parseTransactionData } from "./TransactionData/parseTransactionData";
import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { getLeastUsedCredentialInstance } from "../CredentialBatchHelper";
import { WalletStateUtils } from "@/services/WalletStateUtils";
import { TransactionDataResponse } from "./TransactionData/TransactionDataResponse/TransactionDataResponse";

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

export function useOpenID4VP({
	showCredentialSelectionPopup,
	showStatusPopup,
	showTransactionDataConsentPopup,
}: {
	showCredentialSelectionPopup: (
		conformantCredentialsMap: any,
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData?: ParsedTransactionData[],
	) => Promise<Map<string, number>>,
	showStatusPopup: (
		message: { title: string, description: string },
		type: 'error' | 'success',
	) => Promise<void>,
	showTransactionDataConsentPopup: (options: Record<string, unknown>) => Promise<boolean>,
}): IOpenID4VP {

	const openID4VPRelyingPartyStateRepository = useOpenID4VPRelyingPartyStateRepository();
	const httpProxy = useHttpProxy();
	const { parseCredential } = useContext(CredentialsContext);
	const { keystore, api } = useContext(SessionContext);
	const { t } = useTranslation();


	const promptForCredentialSelection = useCallback(
		async (
			conformantCredentialsMap: any,
			verifierDomainName: string,
			verifierPurpose: string,
			parsedTransactionData: ParsedTransactionData[],
		): Promise<Map<string, number>> => {
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

	async function handleRequestUri(request_uri: string, httpProxy: any): Promise<
		{ payload: Record<string, unknown>, parsedHeader: Record<string, unknown> } |
		{ error: HandleAuthorizationRequestError }> {
		const requestUriResponse = await httpProxy.get(request_uri, {});
		if (typeof requestUriResponse.data !== 'string') {
			return { error: HandleAuthorizationRequestError.COULD_NOT_RESOLVE_REQUEST };
		}
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

	const matchCredentialsToDCQL = useCallback(async (vcList: ExtendedVcEntity[], dcqlJson: any, t: any
	): Promise<
		| { mapping: Map<string, { credentials: number[]; requestedFields: { name: string; purpose: string }[] }>; descriptorPurpose: string }
		| { error: HandleAuthorizationRequestError }
	> => {

		const descriptorPurpose = t('selectCredentialPopup.purposeNotSpecified');

		// shape all credentials in the wallet
		const shapedCredentials: any[] = [];
		for (const vc of vcList) {
			let shaped: any = { credential_format: vc.format };
			try {
				if (vc.format === VerifiableCredentialFormat.MSO_MDOC) {
					const credentialBytes = base64url.decode(vc.data);
					const issuerSigned = cborDecode(credentialBytes);
					const issuerAuth = issuerSigned.get('issuerAuth') as Array<Uint8Array>;
					const payload = issuerAuth?.[2];
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
					const { signedClaims } = await parseCredential(vc);
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
		const result = DcqlQuery.query(parsedQuery, shapedCredentials);

		const matches = result.credential_matches;

		function hasValidMatch(credId: string): boolean {
			const match = matches[credId];
			if (match?.success === false) {
				match.failed_credentials.forEach((failedCreds) => {
					if (failedCreds.meta.success === false) {
						console.error("DCQL metadata issues: ", failedCreds.meta.issues);
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
	}, [parseCredential]);

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

	const handleDCQLFlow = useCallback(async (S, selectionMap, vcEntityList: ExtendedVcEntity[]) => {
		const { dcql_query, client_id, nonce, response_uri, transaction_data } = S;
		let apu = undefined;
		let apv = undefined;
		let selectedVCs = [];
		let generatedVPs = [];
		let originalVCs = [];

		const walletState = keystore.getCalculatedWalletState();
		if (!walletState) {
			throw new Error("Empty wallet state");
		}
		for (const [selectionKey, batchId] of selectionMap) {
			const credential = await getLeastUsedCredentialInstance(batchId, vcEntityList, walletState);
			if (!credential) continue;

			if (
				credential.format === VerifiableCredentialFormat.VC_SDJWT ||
				credential.format === VerifiableCredentialFormat.DC_SDJWT
			) {
				const descriptor = dcql_query.credentials.find(c => c.id === selectionKey);
				if (!descriptor) {
					throw new Error(`No DCQL descriptor for id ${selectionKey}`);
				}
				const { signedClaims } = await parseCredential(credential);

				let paths: string[][];

				if (!descriptor.claims || descriptor.claims.length === 0) {
					// All claims are requested, get keys from signedClaims
					paths = [];
					const getNestedPaths = (val: any, path: string[]) => {
						if (val === null || typeof val !== "object") {
							if (path.length) paths.push(path);
							return;
						}
						if (Array.isArray(val)) {
							if (path.length) {
								paths.push(path);
							}
							return;
						}
						const entries = Object.entries(val);
						if (entries.length === 0) {
							if (path.length) {
								paths.push(path);
							}
							return;
						}
						for (const [k, v] of entries) {
							getNestedPaths(v, path.concat(k));
						}
					};
					getNestedPaths(signedClaims, []);
				} else {
					// Specific claims requested
					paths = descriptor.claims.map(cl => cl.path);
				}

				const frame = generatePresentationFrameForDCQLPaths(paths);
				const hasher = (data, alg) => {
					const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
					return crypto.subtle.digest(alg, bytes).then(buf => new Uint8Array(buf));
				};

				const sdJwt = await SDJwt.fromEncode(credential.data, hasher);
				const presentation = (credential.data.split("~").length - 1) > 1
					? await sdJwt.present(frame, hasher)
					: credential.data;

				const shaped = {
					credential_format: credential.format,
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
				originalVCs.push(credential);
			}

			else if (credential.format === VerifiableCredentialFormat.MSO_MDOC) {
				// Use DCQL ID (`selectionKey`) to find the descriptor
				const descriptor = dcql_query.credentials.find(c => c.id === selectionKey);
				if (!descriptor) {
					throw new Error(`No DCQL descriptor for id ${selectionKey}`);
				}
				const descriptorId = descriptor.meta?.doctype_value!;
				const credentialBytes = base64url.decode(credential.data);
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
					dcqlQueryWithClaims = dcql_query;
				}

				const presentationDefinition = convertDcqlToPresentationDefinition(dcqlQueryWithClaims);
				const { deviceResponseMDoc } = await keystore.generateDeviceResponse(mdoc, presentationDefinition, apu, apv, client_id, response_uri);
				const encodedDeviceResponse = base64url.encode(deviceResponseMDoc.encode());

				selectedVCs.push(encodedDeviceResponse);
				generatedVPs.push(encodedDeviceResponse);
				originalVCs.push(credential);
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

		if ([ResponseMode.DIRECT_POST_JWT, ResponseMode.DC_API_JWT].includes(S.response_mode) && S.client_metadata.authorization_encrypted_response_alg) {
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
	}, [keystore, parseCredential]);


	const handleAuthorizationRequest = useCallback(async (
		url: string,
		vcEntityList: ExtendedVcEntity[],
	): Promise<
		{
			conformantCredentialsMap: Map<string, any>,
			verifierDomainName: string,
			verifierPurpose: string,
			parsedTransactionData: ParsedTransactionData[] | null,
		}
		| { error: HandleAuthorizationRequestError }
	> => {
		let {
			client_id,
			response_uri,
			nonce,
			state,
			client_metadata,
			response_mode,
			transaction_data,
			request_uri,
			dcql_query
		} = parseAuthorizationParams(url);

		const client_id_scheme = client_id.split(':')[0];
		if (client_id_scheme !== 'x509_san_dns') {
			return { error: HandleAuthorizationRequestError.NON_SUPPORTED_CLIENT_ID_SCHEME };
		}

		let parsedTransactionData: ParsedTransactionData[] | null = null;
		if (request_uri) {
			try {
				const result = await handleRequestUri(request_uri, httpProxy);
				if ('error' in result) {
					return result;
				}
				const { payload, parsedHeader } = result;
				client_id = payload.client_id;

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
					parsedTransactionData = parseTransactionData(transaction_data, dcql_query);
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

		if (!dcql_query) {
			return { error: HandleAuthorizationRequestError.MISSING_DCQL_QUERY };
		}

		const { error } = ResponseModeSchema.safeParse(response_mode);
		if (error) {
			return { error: HandleAuthorizationRequestError.INVALID_RESPONSE_MODE };
		}


		console.log("VC entity list = ", vcEntityList)
		const vcList = vcEntityList.filter((cred) => cred.instanceId === 0);

		await openID4VPRelyingPartyStateRepository.store(new OpenID4VPRelyingPartyState(
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
		console.log('DCQL Query: ', dcql_query);
		if (dcql_query) {
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
	}, [
		httpProxy,
		openID4VPRelyingPartyStateRepository,
		matchCredentialsToDCQL,
		t,
	]);

	const sendAuthorizationResponse = useCallback(async (selectionMap, vcEntityList) => {
		const S = await openID4VPRelyingPartyStateRepository.retrieve();

		if (!S || S.nonce === "" || S.nonce === sessionStorage.getItem("last_used_nonce")) {
			return {};
		}
		sessionStorage.setItem("last_used_nonce", S.nonce);


		let formData, generatedVPs, filteredVCEntities;

		({ formData, generatedVPs, filteredVCEntities } =	await handleDCQLFlow(S, selectionMap, vcEntityList));

		const transactionId = WalletStateUtils.getRandomUint32();
		const [, newPrivateData, keystoreCommit] = await keystore.addPresentations(generatedVPs.map((vpData, index) => {
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
	}, [
		httpProxy,
		openID4VPRelyingPartyStateRepository,
		showStatusPopup,
		api,
		keystore,
		handleDCQLFlow,
	]);

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
