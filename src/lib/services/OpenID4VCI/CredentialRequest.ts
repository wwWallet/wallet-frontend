import { compactDecrypt, CompactDecryptResult, CompactEncrypt, exportJWK, generateKeyPair, importJWK, JWK, KeyLike } from "jose";
import { generateDPoP } from "../../utils/dpop";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useOpenID4VCIHelper } from "../OpenID4VCIHelper";
import { useContext, useCallback, useMemo, useRef } from "react";
import SessionContext from "@/context/SessionContext";
import { OpenidCredentialIssuerMetadata } from "wallet-common";
import { OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE } from "@/config";

export function useCredentialRequest() {
	const httpProxy = useHttpProxy();
	const openID4VCIHelper = useOpenID4VCIHelper();
	const { keystore, api } = useContext(SessionContext);

	const credentialEndpointURLRef = useRef<string | null>(null);
	const deferredCredentialEndpointURLRef = useRef<string | null>(null);
	const accessTokenRef = useRef<string | null>(null);
	const cNonceRef = useRef<string | null>(null);
	const dpopNonceRef = useRef<string | null>(null);
	const dpopPrivateKeyRef = useRef<KeyLike | null>(null);
	const dpopPublicKeyJwkRef = useRef<JWK | null>(null);
	const jtiRef = useRef<string | null>(null);
	const credentialIssuerIdentifierRef = useRef<string | null>(null);
	const credentialConfigurationIdRef = useRef<string | null>(null);

	const credentialIssuerMetadataRef = useRef<{ metadata: OpenidCredentialIssuerMetadata } | null>(null);

	const { post, updatePrivateData } = api;

	const requestKeyAttestation = useCallback(async (jwks: JWK[], nonce: string) => {
		try {
			const response = await post("/wallet-provider/key-attestation/generate", {
				jwks,
				openid4vci: {
					nonce: nonce,
				}
			});
			const { key_attestation } = response.data;
			if (!key_attestation || typeof key_attestation != 'string') {
				console.log("Cannot parse key_attestation from wallet-backend-server");
				return null;
			}
			return { key_attestation };
		}
		catch (err) {
			console.log(err);
			return null;
		}
	}, [post]
	);

	const httpHeaders = useMemo(() => ({
		'Content-Type': 'application/json',
	}), []);

	const setCredentialEndpoint = useCallback((endpoint: string | null) => {
		deferredCredentialEndpointURLRef.current = null;
		credentialEndpointURLRef.current = endpoint;
	}, []);

	const setDeferredCredentialEndpoint = useCallback((endpoint: string | null) => {
		credentialEndpointURLRef.current = null;
		deferredCredentialEndpointURLRef.current = endpoint;
	}, []);


	const setCNonce = useCallback((cNonce: string) => {
		cNonceRef.current = cNonce;
	}, []);

	const setAccessToken = useCallback((at: string) => {
		accessTokenRef.current = at;
		httpHeaders['Authorization'] = `Bearer ${at}`;
	}, [httpHeaders]);

	const setDpopNonce = useCallback((dpopNonce: string) => {
		dpopNonceRef.current = dpopNonce;
	}, []);

	const setDpopPrivateKey = useCallback((sk: KeyLike) => {
		dpopPrivateKeyRef.current = sk;
	}, []);

	const setDpopPublicKeyJwk = useCallback((jwk: JWK) => {
		dpopPublicKeyJwkRef.current = jwk;
	}, []);

	const setDpopJti = useCallback((id: string) => {
		jtiRef.current = id;
	}, []);

	const setCredentialConfigurationId = useCallback((id: string) => {
		credentialConfigurationIdRef.current = id;
	}, []);

	const setDpopHeader = useCallback(async () => {
		const credentialEndpointURL = credentialEndpointURLRef.current ?? deferredCredentialEndpointURLRef.current;
		const dpopPublicKeyJwk = dpopPublicKeyJwkRef.current;
		if (!dpopPublicKeyJwk) {
			return;
		}
		const jti = jtiRef.current;
		const dpopNonce = dpopNonceRef.current;
		const accessToken = accessTokenRef.current;

		if (!credentialEndpointURL || !dpopPublicKeyJwk || !jti) {
			throw new Error("Missing required parameters for DPoP header");
		}

		if (!dpopPublicKeyJwk) {
			throw new Error("CredentialRequest: dpopPublicKeyJwk was not defined");
		}


		const credentialEndpointDPoP = await generateDPoP(
			dpopPrivateKeyRef.current,
			dpopPublicKeyJwk,
			"POST",
			credentialEndpointURL,
			dpopNonce,
			accessToken
		);

		httpHeaders['Authorization'] = `DPoP ${accessToken}`;
		httpHeaders['dpop'] = credentialEndpointDPoP;
	}, [httpHeaders]);

	const setCredentialIssuerIdentifier = useCallback((id: string) => {
		credentialIssuerIdentifierRef.current = id;
	}, []);

	const executeDeferredFetch = useCallback(async (transactionId: string): Promise<{ credentialResponse: any }> => {
		try {
			const credentialResponse = await httpProxy.post(deferredCredentialEndpointURLRef.current, { transaction_id: transactionId }, httpHeaders);
			return { credentialResponse };
		}
		catch (err) {
			console.error(err);
			throw new Error("Deferred Credential Request failed");
		}

	}, [httpProxy, httpHeaders]);

	const execute = useCallback(async (credentialConfigurationId: string, proofType: "jwt" | "attestation", cachedProofs?: unknown[]): Promise<{ credentialResponse: any }> => {
		console.log("Executing credential request...");
		const credentialIssuerIdentifier = credentialIssuerIdentifierRef.current;
		const c_nonce = cNonceRef.current;

		const [credentialIssuerMetadata, clientId] = await Promise.all([
			openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
			openID4VCIHelper.getClientId(credentialIssuerIdentifier),
		]);

		const credentialEndpointBody = {} as any;
		const numberOfProofs = credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size && credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size > OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE ?
			OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE :
			credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size ?? 1;
		let proofs: {
			nonce: string,
			issuer: string,
			audience: string
		}[] | null = null;
		let keyAttestation: string | null = null;

		let proofsToSend: string[] = [];

		try {
			if (proofType === "jwt") {
				const inputs = [];
				for (let i = 0; i < numberOfProofs; i++) {
					inputs.push({
						nonce: c_nonce ?? undefined,
						issuer: clientId.client_id,
						audience: credentialIssuerMetadata.metadata.credential_issuer
					})
				}
				proofs = inputs;
			}
			else if (proofType === "attestation") {
				const numberOfKeypairsToGenerate = numberOfProofs;
				const [{ keypairs }, newPrivateData, keystoreCommit] = await keystore.generateKeypairs(numberOfKeypairsToGenerate);
				await updatePrivateData(newPrivateData);
				await keystoreCommit();
				const publicKeys = keypairs.map(kp => kp.publicKey);

				const requestKeyAttestationResponse = await requestKeyAttestation(publicKeys, c_nonce);
				if (!requestKeyAttestationResponse) {
					throw new Error("Failed to get key attestation from wallet-backend-server");
				}
				keyAttestation = requestKeyAttestationResponse.key_attestation;
			}

			if (cachedProofs || proofs) {
				if (cachedProofs) {
					proofsToSend = cachedProofs as string[];
				}
				else if (!cachedProofs && proofs) {
					const [{ proof_jwts }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs(proofs);
					await updatePrivateData(newPrivateData);
					await keystoreCommit();
					proofsToSend = proof_jwts;
				}

				credentialEndpointBody.proofs = {
					jwt: proofsToSend
				}
			}
			else if (keyAttestation) {
				credentialEndpointBody.proofs = {
					attestation: [keyAttestation],
				};
			}
			else {
				throw new Error("Nor proofs, nor keyAttestation was defined before sending CredentialRequest");
			}
		}
		catch (err) {
			console.error(err);
			throw new Error("Failed to generate proof");
		}

		credentialIssuerMetadataRef.current = credentialIssuerMetadata;

		credentialEndpointBody.credential_configuration_id = credentialConfigurationId;

		console.log("Credential endpoint body = ", credentialEndpointBody);

		let credentialRequestEncryptionRequested = false;
		let credentialRequestEncryptionAlg: string | undefined;
		let credentialRequestEncryptionEnc: string | undefined;

		if (credentialIssuerMetadata.metadata.credential_request_encryption) {
			credentialRequestEncryptionRequested = true;

			const credentialRequestEncryptionRequired = credentialIssuerMetadata.metadata.credential_request_encryption.encryption_required;

			const credentialRequestEncryptionSupportedErrors = [];

			const credentialRequestWalletSupportedAlg = ['ECDH-ES'];
			const credentialRequestIssuerSupportedAlg = credentialIssuerMetadata.metadata.credential_request_encryption.jwks.keys.map(k => k.alg);
			credentialRequestEncryptionAlg = credentialRequestWalletSupportedAlg.find(alg => credentialRequestIssuerSupportedAlg.includes(alg));
			if (!credentialRequestEncryptionAlg) {
				credentialRequestEncryptionSupportedErrors.push(`No supported credential_request_encryption keys found. Keys using Alg values[${credentialRequestWalletSupportedAlg.join(', ')}] are supported.`);
			}

			const credentialRequestWalletSupportedEnc = ['A128GCM'];
			const credentialRequestIssuerSupportedEnc = credentialIssuerMetadata.metadata.credential_request_encryption.enc_values_supported;
			credentialRequestEncryptionEnc = credentialRequestWalletSupportedEnc.find(enc => credentialRequestIssuerSupportedEnc.includes(enc));
			if (!credentialRequestEncryptionEnc) {
				credentialRequestEncryptionSupportedErrors.push(`Unsupported credential_request_encryption.enc_values_supported. [${credentialRequestWalletSupportedEnc.join(', ')}] are supported.`);
			}

			if (credentialRequestEncryptionSupportedErrors.length > 0) {
				console.log(credentialRequestEncryptionSupportedErrors);
				if (credentialRequestEncryptionRequired) {
					throw new Error("Credential request encryption requirements not met: " + credentialRequestEncryptionSupportedErrors.join("; "));
				}
				else {
					credentialRequestEncryptionRequested = false;
				}
			}
		}

		let credentialResponseEncryptionRequested = false;
		let credentialResponseEncryptionAlg: string | undefined;
		let credentialResponseEncryptionEnc: string | undefined;
		let ephemeralKeypair: CryptoKeyPair | undefined;

		if (credentialIssuerMetadata.metadata.credential_response_encryption) {
			credentialResponseEncryptionRequested = true;

			const credentialResponseEncryptionRequired = credentialIssuerMetadata.metadata.credential_response_encryption.encryption_required;

			const credentialResponseEncryptionSupportedErrors = [];

			const credentialResponseWalletSupportedAlg = ['ECDH-ES'];
			const credentialResponseIssuerSupportedAlg = credentialIssuerMetadata.metadata.credential_response_encryption.alg_values_supported;
			credentialResponseEncryptionAlg = credentialResponseWalletSupportedAlg.find(alg => credentialResponseIssuerSupportedAlg.includes(alg));
			if (!credentialResponseEncryptionAlg) {
				credentialResponseEncryptionSupportedErrors.push(`Unsupported credential_response_encryption.alg_values_supported. [${credentialResponseWalletSupportedAlg.join(', ')}] are supported`);
			}

			const credentialResponseWalletSupportedEnc = ['A128CBC-HS256', 'A128GCM', 'A256GCM'];
			const credentialResponseIssuerSupportedEnc = credentialIssuerMetadata.metadata.credential_response_encryption.enc_values_supported;
			credentialResponseEncryptionEnc = credentialResponseWalletSupportedEnc.find(enc => credentialResponseIssuerSupportedEnc.includes(enc));
			if (!credentialResponseEncryptionEnc) {
				credentialResponseEncryptionSupportedErrors.push(`Unsupported credential_response_encryption.enc_values_supported. [${credentialResponseWalletSupportedEnc.join(', ')}] are supported`);
			}

			if (credentialResponseEncryptionSupportedErrors.length > 0) {
				if (credentialResponseEncryptionRequired) {
					throw new Error("Credential response encryption requirements not met: " + credentialResponseEncryptionSupportedErrors.join("; "));
				}
				else {
					credentialResponseEncryptionRequested = false;
				}
			}
		}

		if (credentialResponseEncryptionRequested) {

			ephemeralKeypair = await generateKeyPair(credentialResponseEncryptionAlg);

			const ephemeralPublicKeyJwk = await exportJWK(ephemeralKeypair.publicKey);
			credentialEndpointBody.credential_response_encryption = {
				alg: credentialResponseEncryptionAlg,
				enc: credentialResponseEncryptionEnc,
				jwk: {
					...ephemeralPublicKeyJwk,
					alg: credentialResponseEncryptionAlg,
					use: 'enc'
				},
			};
		}

		let credentialRequestContentType: string;
		let credentialRequestBody: string | object;
		if (credentialRequestEncryptionRequested) {
			const jwk = credentialIssuerMetadata.metadata.credential_request_encryption.jwks.keys.find(k => k.alg === credentialRequestEncryptionAlg);
			const clientPublicKey = await importJWK(jwk, credentialRequestEncryptionAlg);
			const jwe = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(credentialEndpointBody)))
				.setProtectedHeader({
					enc: credentialRequestEncryptionEnc,
					alg: credentialRequestEncryptionAlg,
				})
				.encrypt(clientPublicKey);

			credentialRequestContentType = 'application/jwt';
			credentialRequestBody = jwe;
		}
		else {
			credentialRequestContentType = 'application/json';
			credentialRequestBody = credentialEndpointBody;
		}

		console.log(`Sending ${credentialRequestEncryptionRequested ? 'encrypted (JWT)' : 'unencrypted (JSON)'} credential request to `, credentialEndpointURLRef.current, credentialRequestBody, httpHeaders);
		httpHeaders['Content-Type'] = credentialRequestContentType;
		const credentialResponse = await httpProxy.post(credentialEndpointURLRef.current, credentialRequestBody, httpHeaders);

		const credentialResponseContentType = credentialResponse.headers['Content-Type'] ?? credentialResponse.headers['content-type'];
		if (credentialResponseEncryptionRequested && typeof credentialResponseContentType === 'string' && credentialResponseContentType.startsWith('application/jwt')) {
			const result = await compactDecrypt(credentialResponse.data as string, ephemeralKeypair.privateKey).then((r) => ({ data: r, err: null })).catch((err) => ({ data: null, err: err }));
			if (result.err) {
				throw new Error("Credential Response decryption failed");
			}
			const { plaintext } = result.data as CompactDecryptResult;
			const payload = JSON.parse(new TextDecoder().decode(plaintext));
			credentialResponse.data = payload;
		}
		if (credentialResponse.status >= 400) {
			console.error("Error: Credential response = ", JSON.stringify(credentialResponse));
			if (credentialResponse.headers?.["www-authenticate"] && (
				(credentialResponse.headers?.["www-authenticate"] as string).includes("invalid_dpop_proof") ||
				(credentialResponse.headers?.["www-authenticate"] as string).includes("use_dpop_nonce")
			) && "dpop-nonce" in credentialResponse.headers) {
				console.log("Calling credentialRequest with new dpop-nonce....")

				setDpopNonce(credentialResponse.headers?.["dpop-nonce"] as string);
				await setDpopHeader();
				// response.headers['dpop-nonce'] = credentialResponse.err.headers["dpop-nonce"];
				return await execute(credentialConfigurationId, proofType, proofsToSend);
			}
			throw new Error("Credential Request failed");
		}

		// const credentialResponseData = credentialResponse.data as { credentials: { credential: string }[] };



		// receivedCredentialsArrayRef.current = credentialArray;
		console.log("Credential response: ", credentialResponse);
		return { credentialResponse };
	}, [updatePrivateData, httpProxy, keystore, openID4VCIHelper, setDpopHeader, setDpopNonce, httpHeaders, requestKeyAttestation]);



	return useMemo(() => ({
		setCredentialEndpoint,
		setDeferredCredentialEndpoint,
		setCNonce,
		setAccessToken,
		setDpopNonce,
		setDpopPrivateKey,
		setDpopPublicKeyJwk,
		setDpopJti,
		setCredentialConfigurationId,
		setDpopHeader,
		setCredentialIssuerIdentifier,
		executeDeferredFetch,
		execute,
	}), [
		setCredentialEndpoint,
		setDeferredCredentialEndpoint,
		setCNonce,
		setAccessToken,
		setDpopNonce,
		setDpopPrivateKey,
		setDpopPublicKeyJwk,
		setDpopJti,
		setCredentialConfigurationId,
		setDpopHeader,
		setCredentialIssuerIdentifier,
		executeDeferredFetch,
		execute,
	]);
}
