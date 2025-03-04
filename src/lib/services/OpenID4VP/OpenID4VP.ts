import { HandleAuthorizationRequestError, IOpenID4VP } from "../../interfaces/IOpenID4VP";
import { Verify } from "../../utils/Verify";
import { HasherAlgorithm, HasherAndAlgorithm, SdJwt } from "@sd-jwt/core";
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
import CredentialParserContext from "@/context/CredentialParserContext";

export function useOpenID4VP({ showCredentialSelectionPopup }: { showCredentialSelectionPopup: (conformantCredentialsMap: any, verifierDomainName: string, verifierPurpose: string) => Promise<Map<string, string>> }): IOpenID4VP {

	console.log('useOpenID4VP');
	const openID4VPRelyingPartyStateRepository = useOpenID4VPRelyingPartyStateRepository();
	const httpProxy = useHttpProxy();
	const { parseCredential } = useContext(CredentialParserContext);
	const credentialBatchHelper = useCredentialBatchHelper();
	const { keystore, api } = useContext(SessionContext);

	const storeVerifiablePresentation = useCallback(
		async (presentation: string, presentationSubmission: any, identifiersOfIncludedCredentials: string[], audience: string) => {
			await api.post('/storage/vp', {
				presentationIdentifier: generateRandomIdentifier(32),
				presentation,
				presentationSubmission,
				includedVerifiableCredentialIdentifiers: identifiersOfIncludedCredentials,
				audience,
				issuanceDate: new Date().toISOString(),
			});
		},
		[api]
	);

	const getAllStoredVerifiableCredentials = useCallback(async () => {
		const fetchAllCredentials = await api.get("/storage/vc");
		return { verifiableCredentials: fetchAllCredentials.data.vc_list };
	},
		[api]
	);

	const promptForCredentialSelection = useCallback(
		async (conformantCredentialsMap: any, verifierDomainName: string, verifierPurpose: string): Promise<Map<string, string>> => {
			return showCredentialSelectionPopup(conformantCredentialsMap, verifierDomainName, verifierPurpose);
		},
		[showCredentialSelectionPopup]
	);

	const handleAuthorizationRequest = useCallback(
		async (url: string): Promise<{ conformantCredentialsMap: Map<string, any>; verifierDomainName: string, verifierPurpose: string } | { err: HandleAuthorizationRequestError }> => {
			const authorizationRequest = new URL(url);
			let client_id = authorizationRequest.searchParams.get('client_id');
			let response_uri = authorizationRequest.searchParams.get('response_uri');
			let nonce = authorizationRequest.searchParams.get('nonce');
			let state = authorizationRequest.searchParams.get('state') as string;
			let presentation_definition = authorizationRequest.searchParams.get('presentation_definition') ? JSON.parse(authorizationRequest.searchParams.get('presentation_definition')) : null;
			let presentation_definition_uri = authorizationRequest.searchParams.get('presentation_definition_uri');
			let client_metadata = authorizationRequest.searchParams.get('client_metadata') ? JSON.parse(authorizationRequest.searchParams.get('client_metadata')) : null;
			let response_mode = authorizationRequest.searchParams.get('response_mode') ? JSON.parse(authorizationRequest.searchParams.get('response_mode')) : null;
			if (presentation_definition_uri) {
				const presentationDefinitionFetch = await httpProxy.get(presentation_definition_uri, {});
				presentation_definition = presentationDefinitionFetch.data;
			}

			const request_uri = authorizationRequest.searchParams.get('request_uri');


			if (request_uri) {
				const requestUriResponse = await httpProxy.get(request_uri, {});
				const requestObject = requestUriResponse.data as string; // jwt
				const [header, payload] = requestObject.split('.');
				const parsedHeader = JSON.parse(new TextDecoder().decode(base64url.decode(header)));

				const publicKey = await importX509(getPublicKeyFromB64Cert(parsedHeader.x5c[0]), parsedHeader.alg);
				const verificationResult = await jwtVerify(requestObject, publicKey).catch(() => null);
				if (verificationResult == null) {
					console.log("Signature verification of request_uri failed");
					return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
				}
				const p = JSON.parse(new TextDecoder().decode(base64url.decode(payload)));
				client_id = p.client_id;
				presentation_definition = p.presentation_definition;
				response_uri = p.response_uri ?? p.redirect_uri;
				client_metadata = p.client_metadata;
				if (p.response_mode) {
					response_mode = p.response_mode;
				}

				state = p.state;
				nonce = p.nonce;
				if (!response_uri.startsWith("http")) {
					response_uri = `https://${response_uri}`;
				}

				if (new URL(request_uri).hostname !== new URL(response_uri).hostname) {
					console.log("Hostname of request_uri is different from response_uri")
					return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
				}
				const altNames = await extractSAN('-----BEGIN CERTIFICATE-----\n' + parsedHeader.x5c[0] + '\n-----END CERTIFICATE-----');

				if (OPENID4VP_SAN_DNS_CHECK && (!altNames || altNames.length === 0)) {
					console.log("No SAN found");
					return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
				}

				if (OPENID4VP_SAN_DNS_CHECK && !altNames.includes(new URL(response_uri).hostname)) {
					console.log("altnames = ", altNames)
					console.log("request_uri uri hostname = ", new URL(request_uri).hostname)
					console.log("Hostname of request_uri is not included in the SAN list")
					return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
				}

				if (OPENID4VP_SAN_DNS_CHECK_SSL_CERTS) { // get x5c from SSL
					const response = await axios.post(`${BACKEND_URL}/helper/get-cert`, {
						url: request_uri
					}, {
						timeout: 2500,
						headers: {
							Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken'))
						}
					}).catch(() => null);
					if (response === null) {
						throw new Error("Could not get SSL certificate for " + new URL(request_uri).hostname);
					}
					const { x5c } = response.data;
					if (x5c[0] !== parsedHeader.x5c[0]) {
						throw new Error("x509 SAN DNS: Invalid signer certificate");
					}
				}
			}


			const lastUsedNonce = sessionStorage.getItem('last_used_nonce');
			if (lastUsedNonce && nonce === lastUsedNonce) {
				return { err: HandleAuthorizationRequestError.OLD_STATE }
			}

			if (!presentation_definition) {
				return { err: HandleAuthorizationRequestError.MISSING_PRESENTATION_DEFINITION };
			}

			const { error } = ResponseModeSchema.safeParse(response_mode);
			if (error) {
				return { err: HandleAuthorizationRequestError.INVALID_RESPONSE_MODE };
			}

			const vcList = await getAllStoredVerifiableCredentials().then((res) => res.verifiableCredentials);

			await openID4VPRelyingPartyStateRepository.store(new OpenID4VPRelyingPartyState(
				presentation_definition,
				nonce,
				response_uri,
				client_id,
				state,
				client_metadata,
				response_mode,
			));

			const mapping = new Map<string, { credentials: string[], requestedFields: string[] }>();
			let descriptorPurpose;
			for (const descriptor of presentation_definition.input_descriptors) {
				const conformingVcList = [];
				descriptorPurpose = descriptor.purpose || "Purpose not specified by verifier";

				for (const vc of vcList) {
					try {

						if (vc.format === VerifiableCredentialFormat.SD_JWT_VC && (descriptor.format === undefined || VerifiableCredentialFormat.SD_JWT_VC in descriptor.format)) {
							const result = await parseCredential(vc.credential);
							if ('error' in result) {
								throw new Error('Could not parse credential');
							}
							if (Verify.verifyVcJwtWithDescriptor(descriptor, result.signedClaims)) {
								conformingVcList.push(vc.credentialIdentifier);
								continue;
							}
						}
					}
					catch (err) {
						console.log("Failed to match a descriptor")
						console.log(err)
					}

				}
				if (conformingVcList.length === 0) {
					return { err: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
				}

				const requestedFieldDetails = descriptor.constraints.fields.map((field) => ({
					name: field.name || field.path[0],
					purpose: field.purpose || descriptorPurpose // Use field-specific purpose if available, otherwise fall back to descriptor-level
				}));
				mapping.set(descriptor.id, { credentials: [...conformingVcList], requestedFields: requestedFieldDetails });
			}
			const verifierDomainName = client_id.includes("http") ? new URL(client_id).hostname : client_id;
			if (mapping.size === 0) {
				console.log("Credentials don't satisfy any descriptor")
				throw new Error("Credentials don't satisfy any descriptor");
			}
			return { conformantCredentialsMap: mapping, verifierDomainName: verifierDomainName, verifierPurpose: descriptorPurpose };
		},
		[httpProxy, parseCredential, getAllStoredVerifiableCredentials, openID4VPRelyingPartyStateRepository]
	);

	const sendAuthorizationResponse = useCallback(
		async (selectionMap: Map<string, string>): Promise<{ url?: string } | { presentation_during_issuance_session: string }> => {
			const S = await openID4VPRelyingPartyStateRepository.retrieve();
			console.log("send AuthorizationResponse: S = ", S)
			console.log("send AuthorizationResponse: Sess = ", sessionStorage.getItem('last_used_nonce'));
			if (S?.nonce === "" || (sessionStorage.getItem('last_used_nonce') && S.nonce === sessionStorage.getItem('last_used_nonce'))) {
				return {};
			}
			else {
				sessionStorage.setItem('last_used_nonce', S.nonce);
			}
			async function hashSHA256(input) {
				// Step 1: Encode the input string as a Uint8Array
				const encoder = new TextEncoder();
				const data = encoder.encode(input);

				// Step 2: Hash the data using SHA-256
				const hashBuffer = await crypto.subtle.digest('SHA-256', data);
				return new Uint8Array(hashBuffer);
			}

			const hasherAndAlgorithm: HasherAndAlgorithm = {
				hasher: async (input: string) => hashSHA256(input),
				algorithm: HasherAlgorithm.Sha256
			}

			/**
			*
			* @param paths example: [ '$.credentialSubject.image', '$.credentialSubject.grade', '$.credentialSubject.val.x' ]
			* @returns example: { credentialSubject: { image: true, grade: true, val: { x: true } } }
			*/
			const generatePresentationFrameForPaths = (paths) => {
				let result = {};

				paths.forEach((path: string) => {
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
					}
					else {
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
			};


			const presentationDefinition = S.presentation_definition;
			const response_uri = S.response_uri;
			const client_id = S.client_id;
			const nonce = S.nonce;

			let { verifiableCredentials } = await getAllStoredVerifiableCredentials();
			const allSelectedCredentialIdentifiers = Array.from(selectionMap.values());

			// returns the credentials with the minimum usages for each credential identifier
			const credentialsFilteredByUsage = await Promise.all(allSelectedCredentialIdentifiers.map(async (credentialIdentifier) => {
				const result = await credentialBatchHelper.getLeastUsedCredential(credentialIdentifier, verifiableCredentials)
				return result.credential;
			}));

			const filteredVCEntities = credentialsFilteredByUsage
				.filter((vc) =>
					allSelectedCredentialIdentifiers.includes(vc.credentialIdentifier),
				);

			let selectedVCs = [];
			let generatedVPs = [];
			let originalVCs = [];
			const descriptorMap = [];
			let i = 0;
			for (const [descriptor_id, credentialIdentifier] of selectionMap) {
				const vcEntity = filteredVCEntities.filter((vc) => vc.credentialIdentifier === credentialIdentifier)[0];
				if (vcEntity.format === VerifiableCredentialFormat.SD_JWT_VC) {
					const descriptor = presentationDefinition.input_descriptors.filter((desc) => desc.id === descriptor_id)[0];
					const allPaths = descriptor.constraints.fields
						.map((field) => field.path)
						.reduce((accumulator, currentValue) => [...accumulator, ...currentValue]);
					let presentationFrame = generatePresentationFrameForPaths(allPaths);
					const sdJwt = SdJwt.fromCompact<Record<string, unknown>, any>(
						vcEntity.credential
					).withHasher(hasherAndAlgorithm);
					const presentation = await sdJwt.present(presentationFrame);
					const { vpjwt } = await keystore.signJwtPresentation(nonce, client_id, [presentation]);
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
				}
			}

			const presentationSubmission = {
				id: generateRandomIdentifier(8),
				definition_id: S.presentation_definition.id,
				descriptor_map: descriptorMap,
			};

			const formData = new URLSearchParams();

			if (S.response_mode === ResponseMode.DIRECT_POST_JWT && S.client_metadata.authorization_encrypted_response_alg && S.client_metadata.jwks.keys.length > 0) {
				const rp_eph_pub_jwk = S.client_metadata.jwks.keys[0];
				const rp_eph_pub = await importJWK(rp_eph_pub_jwk, S.client_metadata.authorization_encrypted_response_alg);
				const jwe = await new EncryptJWT({
					vp_token: generatedVPs.length === 1 ? generatedVPs[0] : generatedVPs,
					presentation_submission: presentationSubmission,
					state: S.state ?? undefined
				})
					.setProtectedHeader({ alg: S.client_metadata.authorization_encrypted_response_alg, enc: S.client_metadata.authorization_encrypted_response_enc, kid: rp_eph_pub_jwk.kid })
					.encrypt(rp_eph_pub);

				formData.append('response', jwe);
				console.log("JWE = ", jwe)
			}
			else {
				formData.append('vp_token', generatedVPs.length === 1 ? generatedVPs[0] : JSON.stringify(generatedVPs));
				formData.append('presentation_submission', JSON.stringify(presentationSubmission));
				if (S.state) {
					formData.append('state', S.state);
				}
			}


			const credentialIdentifiers = originalVCs.map((vc) => vc.credentialIdentifier);

			const presentations = "b64:" + toBase64(new TextEncoder().encode(generatedVPs.length === 1 ? generatedVPs[0] : JSON.stringify(generatedVPs)));
			const storePresentationPromise = storeVerifiablePresentation(presentations, presentationSubmission, credentialIdentifiers, client_id);
			const updateCredentialPromise = filteredVCEntities.map(async (cred) => credentialBatchHelper.useCredential(cred))

			const updateRepositoryPromise = openID4VPRelyingPartyStateRepository.store(S);

			await Promise.all([storePresentationPromise, ...updateCredentialPromise, updateRepositoryPromise]);

			const res = await httpProxy.post(response_uri, formData.toString(), {
				'Content-Type': 'application/x-www-form-urlencoded',
			});

			const responseData = res.data as { presentation_during_issuance_session?: string, redirect_uri?: string };
			console.log("Direct post response = ", JSON.stringify(res.data));
			if (responseData.presentation_during_issuance_session) {
				return { presentation_during_issuance_session: responseData.presentation_during_issuance_session }
			}
			if (responseData.redirect_uri) {
				return { url: responseData.redirect_uri };
			}
		},
		[httpProxy, keystore, openID4VPRelyingPartyStateRepository, credentialBatchHelper, getAllStoredVerifiableCredentials, storeVerifiablePresentation]
	);

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
