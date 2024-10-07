import { HandleAuthorizationRequestError, IOpenID4VPRelyingParty } from "../interfaces/IOpenID4VPRelyingParty";
import { StorableCredential } from "../types/StorableCredential";
import { Verify } from "../utils/Verify";
import { HasherAlgorithm, HasherAndAlgorithm, SdJwt } from "@sd-jwt/core";
import { VerifiableCredentialFormat } from "../schemas/vc";
import { generateRandomIdentifier } from "../utils/generateRandomIdentifier";
import { base64url, importX509, jwtVerify } from "jose";
import { OpenID4VPRelyingPartyState } from "../types/OpenID4VPRelyingPartyState";
import { OpenID4VPRelyingPartyStateRepository } from "./OpenID4VPRelyingPartyStateRepository";
import { IHttpProxy } from "../interfaces/IHttpProxy";
import { ICredentialParserRegistry } from "../interfaces/ICredentialParser";
import { extractSAN, getPublicKeyFromB64Cert } from "../utils/pki";
import axios from "axios";
import { BACKEND_URL, OPENID4VP_SAN_DNS_CHECK_SSL_CERTS } from "../../config";

export class OpenID4VPRelyingParty implements IOpenID4VPRelyingParty {


	constructor(
		private openID4VPRelyingPartyStateRepository: OpenID4VPRelyingPartyStateRepository,
		private httpProxy: IHttpProxy,
		private credentialParserRegistry: ICredentialParserRegistry,
		private getAllStoredVerifiableCredentials: () => Promise<{ verifiableCredentials: StorableCredential[] }>,
		private signJwtPresentationKeystoreFn: (nonce: string, audience: string, verifiableCredentials: any[]) => Promise<{ vpjwt: string }>,
		private storeVerifiablePresentation: (presentation: string, format: string, identifiersOfIncludedCredentials: string[], presentationSubmission: any, audience: string) => Promise<void>
	) { }


	async handleAuthorizationRequest(url: string): Promise<{ conformantCredentialsMap: Map<string, any>, verifierDomainName: string; } | { err: HandleAuthorizationRequestError }> {
		const authorizationRequest = new URL(url);
		let client_id = authorizationRequest.searchParams.get('client_id');
		let client_id_scheme = authorizationRequest.searchParams.get('client_id_scheme');
		let response_type = authorizationRequest.searchParams.get('response_type');
		let response_mode = authorizationRequest.searchParams.get('response_mode');
		let response_uri = authorizationRequest.searchParams.get('response_uri');
		let scope = authorizationRequest.searchParams.get('scope');
		let nonce = authorizationRequest.searchParams.get('nonce');
		let state = authorizationRequest.searchParams.get('state') as string;
		let presentation_definition = authorizationRequest.searchParams.get('presentation_definition') ? JSON.parse(authorizationRequest.searchParams.get('presentation_definition')) : null;
		let presentation_definition_uri = authorizationRequest.searchParams.get('presentation_definition_uri');

		let client_metadata = {};

		if (presentation_definition_uri) {
			const presentationDefinitionFetch = await this.httpProxy.get(presentation_definition_uri, {});
			presentation_definition = presentationDefinitionFetch.data;
		}

		const request_uri = authorizationRequest.searchParams.get('request_uri');


		if (request_uri) {
			const requestUriResponse = await this.httpProxy.get(request_uri, {});
			const requestObject = requestUriResponse.data; // jwt
			const [header, payload, sig] = requestObject.split('.');
			const parsedHeader = JSON.parse(new TextDecoder().decode(base64url.decode(header)));

			const publicKey = await importX509(getPublicKeyFromB64Cert(parsedHeader.x5c[0]), 'RS256');
			const verificationResult = await jwtVerify(requestObject, publicKey).catch(() => null);
			if (verificationResult == null) {
				console.log("Signature verification of request_uri failed");
				return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
			}
			console.log("Verification result = ", verificationResult);
			const p = JSON.parse(new TextDecoder().decode(base64url.decode(payload)));
			client_id = p.client_id;
			client_id_scheme = p.client_id_scheme;
			response_type = p.response_type;
			presentation_definition = p.presentation_definition;
			response_mode = p.response_mode;
			response_uri = p.response_uri ?? p.redirect_uri;

			state = p.state;
			nonce = p.nonce;
			client_metadata = p.client_metadata;
			if (!response_uri.startsWith("http")) {
				response_uri = `https://${response_uri}`;
			}

			if (new URL(request_uri).hostname != new URL(response_uri).hostname) {
				console.log("Hostname of request_uri is different from response_uri")
				return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
			}
			const altNames = await extractSAN('-----BEGIN CERTIFICATE-----\n' + parsedHeader.x5c[0] + '\n-----END CERTIFICATE-----');

			if (!altNames || altNames.length == 0) {
				console.log("No SAN found");
				return { err: HandleAuthorizationRequestError.NONTRUSTED_VERIFIER }
			}

			if (!altNames.includes(new URL(response_uri).hostname)) {
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
				if (response == null) {
					throw new Error("Could not get SSL certificate for " + new URL(request_uri).hostname);
				}
				const { x5c } = response.data;
				if (x5c[0] != parsedHeader.x5c[0]) {
					throw new Error("x509 SAN DNS: Invalid signer certificate");
				}
			}
		}

		const vcList = await this.getAllStoredVerifiableCredentials().then((res) => res.verifiableCredentials);

		if (!presentation_definition) {
			return { err: HandleAuthorizationRequestError.MISSING_PRESENTATION_DEFINITION };
		}
		if (presentation_definition.input_descriptors.length > 1) {
			return { err: HandleAuthorizationRequestError.ONLY_ONE_INPUT_DESCRIPTOR_IS_SUPPORTED };
		}

		await this.openID4VPRelyingPartyStateRepository.store(new OpenID4VPRelyingPartyState(
			presentation_definition,
			nonce,
			response_uri,
			client_id,
			state
		));

		const mapping = new Map<string, { credentials: string[], requestedFields: string[] }>();
		for (const descriptor of presentation_definition.input_descriptors) {
			const conformingVcList = [];
			for (const vc of vcList) {
				try {

					if (vc.format == VerifiableCredentialFormat.SD_JWT_VC && (descriptor.format == undefined || VerifiableCredentialFormat.SD_JWT_VC in descriptor.format)) {
						const result = await this.credentialParserRegistry.parse(vc.credential);
						if ('error' in result) {
							throw new Error('Could not parse credential');
						}
						if (Verify.verifyVcJwtWithDescriptor(descriptor, result.beautifiedForm)) {
							conformingVcList.push(vc.credentialIdentifier);
							continue;
						}
					}
				}
				catch (err) {
					console.error("Failed to match a descriptor")
					console.error(err)
				}

			}
			if (conformingVcList.length == 0) {
				return { err: HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS };
			}
			const requestedFieldNames = descriptor.constraints.fields
				.map((field) => {
					if (field.name) {
						return field.name;
					}
					return field.path[0];
				})
			mapping.set(descriptor.id, { credentials: [...conformingVcList], requestedFields: requestedFieldNames });
		}
		const verifierDomainName = client_id.includes("http") ? new URL(client_id).hostname : client_id;
		if (mapping.size == 0) {
			console.log("Credentials don't satisfy any descriptor")
			throw new Error("Credentials don't satisfy any descriptor");
		}

		return { conformantCredentialsMap: mapping, verifierDomainName: verifierDomainName };
	}


	async sendAuthorizationResponse(selectionMap: Map<string, string>): Promise<{ url?: string }> {
		const S = await this.openID4VPRelyingPartyStateRepository.retrieve();
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
		const state = S.state;

		let { verifiableCredentials } = await this.getAllStoredVerifiableCredentials();
		const allSelectedCredentialIdentifiers = Array.from(selectionMap.values());
		const filteredVCEntities = verifiableCredentials
			.filter((vc) =>
				allSelectedCredentialIdentifiers.includes(vc.credentialIdentifier),
			);

		let selectedVCs = [];
		let generatedVPs = [];
		let originalVCs = [];
		const descriptorMap = [];
		let i = 0;
		for (const [descriptor_id, credentialIdentifier] of selectionMap) {
			const vcEntity = filteredVCEntities.filter((vc) => vc.credentialIdentifier == credentialIdentifier)[0];
			if (vcEntity.format == VerifiableCredentialFormat.SD_JWT_VC) {
				const descriptor = presentationDefinition.input_descriptors.filter((desc) => desc.id == descriptor_id)[0];
				const allPaths = descriptor.constraints.fields
					.map((field) => field.path)
					.reduce((accumulator, currentValue) => [...accumulator, ...currentValue]);
				let presentationFrame = generatePresentationFrameForPaths(allPaths);
				const sdJwt = SdJwt.fromCompact<Record<string, unknown>, any>(
					vcEntity.credential
				).withHasher(hasherAndAlgorithm);
				const presentation = await sdJwt.present(presentationFrame);
				const { vpjwt } = await this.signJwtPresentationKeystoreFn(nonce, client_id, [presentation]);
				selectedVCs.push(presentation);
				generatedVPs.push(vpjwt);
				descriptorMap.push({
					id: descriptor_id,
					format: VerifiableCredentialFormat.SD_JWT_VC,
					path: `$`
				});
				i++;
				originalVCs.push(vcEntity);
			}
		}

		const presentationSubmission = {
			id: generateRandomIdentifier(8),
			definition_id: S.presentation_definition.id,
			descriptor_map: descriptorMap,
		};

		const formData = new URLSearchParams();
		formData.append('vp_token', generatedVPs[0]);
		formData.append('presentation_submission', JSON.stringify(presentationSubmission));
		if (S.state) {
			formData.append('state', S.state);
		}

		const credentialIdentifiers = originalVCs.map((vc) => vc.credentialIdentifier);

		await this.storeVerifiablePresentation(generatedVPs[0], presentationSubmission.descriptor_map[0].format, credentialIdentifiers, presentationSubmission, client_id);

		const res = await this.httpProxy.post(response_uri, formData.toString(), {
			'Content-Type': 'application/x-www-form-urlencoded',
		});

		console.log("Direct post response = ", JSON.stringify(res.data));

		if (res.data.redirect_uri) {
			return { url: res.data.redirect_uri };
		}
	}
}
