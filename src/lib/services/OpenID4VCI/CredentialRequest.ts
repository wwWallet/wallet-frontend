import { compactDecrypt, CompactDecryptResult, exportJWK, generateKeyPair, JWK, KeyLike } from "jose";
import { generateDPoP } from "../../utils/dpop";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useOpenID4VCIHelper } from "../OpenID4VCIHelper";
import { useContext, useCallback, useMemo, useRef } from "react";
import SessionContext from "@/context/SessionContext";
import { OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE } from "@/config";

export function useCredentialRequest() {
	const httpProxy = useHttpProxy();
	const openID4VCIHelper = useOpenID4VCIHelper();
	const { keystore, api } = useContext(SessionContext);

	const credentialEndpointURLRef = useRef<string | null>(null);
	const accessTokenRef = useRef<string | null>(null);
	const cNonceRef = useRef<string | null>(null);
	const dpopNonceRef = useRef<string | null>(null);
	const dpopPrivateKeyRef = useRef<KeyLike | null>(null);
	const dpopPublicKeyJwkRef = useRef<JWK | null>(null);
	const jtiRef = useRef<string | null>(null);
	const credentialIssuerIdentifierRef = useRef<string | null>(null);

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

	const setCredentialEndpoint = useCallback((endpoint: string) => {
		credentialEndpointURLRef.current = endpoint;
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

	const setDpopHeader = useCallback(async () => {
		const credentialEndpointURL = credentialEndpointURLRef.current;
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

	const execute = useCallback(async (credentialConfigurationId: string, proofType: "jwt" | "attestation", cachedProofs?: unknown[]): Promise<{ credentialResponse: any }> => {
		console.log("Executing credential request...");
		const credentialIssuerIdentifier = credentialIssuerIdentifierRef.current;
		const c_nonce = cNonceRef.current;

		const [credentialIssuerMetadata, clientId] = await Promise.all([
			openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
			openID4VCIHelper.getClientId(credentialIssuerIdentifier),
		]);

		const credentialEndpointBody = { } as any;
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

				if (credentialIssuerMetadata.metadata?.batch_credential_issuance?.batch_size) {
					credentialEndpointBody.proofs = {
						jwt: proofsToSend
					}
				}
				else {
					credentialEndpointBody.proof = {
						proof_type: "jwt",
						jwt: proofsToSend[0]
					};
				}
			}
			else if (keyAttestation) {
				credentialEndpointBody.proof = {
					proof_type: "attestation",
					attestation: keyAttestation,
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


		credentialEndpointBody.credential_configuration_id = credentialConfigurationId;

		console.log("Credential endpoint body = ", credentialEndpointBody);

		let encryptionRequested = false;
		const ephemeralKeypair = await generateKeyPair('ECDH-ES');

		if (credentialIssuerMetadata.metadata.credential_response_encryption) {
			encryptionRequested = true;
			if (!credentialIssuerMetadata.metadata.credential_response_encryption.alg_values_supported.includes('ECDH-ES')) {
				throw new Error("Unsupported credential_response_encryption.alg_values_supported. ['ECDH-ES'] are supported");
			}
			if (!credentialIssuerMetadata.metadata.credential_response_encryption.enc_values_supported.includes('A128CBC-HS256')) {
				throw new Error("Unsupported credential_response_encryption.enc_values_supported. ['A128CBC-HS256'] are supported");
			}

			const ephemeralPublicKeyJwk = await exportJWK(ephemeralKeypair.publicKey);
			credentialEndpointBody.credential_response_encryption = {
				alg: 'ECDH-ES',
				enc: 'A128CBC-HS256',
				jwk: { ...ephemeralPublicKeyJwk, "use": "enc", },
			};
		}

		const credentialResponse = await httpProxy.post(credentialEndpointURLRef.current, credentialEndpointBody, httpHeaders);
		if (encryptionRequested && credentialResponse.headers['content-type'] === 'application/jwt') {
			const result = await compactDecrypt(credentialResponse.data as string, ephemeralKeypair.privateKey).then((r) => ({ data: r, err: null })).catch((err) => ({ data: null, err: err }));
			if (result.err) {
				throw new Error("Credential Response decryption failed");
			}
			const { protectedHeader, plaintext } = result.data as CompactDecryptResult;
			const payload = JSON.parse(new TextDecoder().decode(plaintext));
			credentialResponse.data = payload;
		}
		if (credentialResponse.status !== 200) {
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
		return { credentialResponse };
	}, [updatePrivateData, httpProxy, keystore, openID4VCIHelper, setDpopHeader, setDpopNonce, httpHeaders, requestKeyAttestation]);

	return useMemo(() => ({
		setCredentialEndpoint,
		setCNonce,
		setAccessToken,
		setDpopNonce,
		setDpopPrivateKey,
		setDpopPublicKeyJwk,
		setDpopJti,
		setDpopHeader,
		setCredentialIssuerIdentifier,
		execute,
	}), [
		setCredentialEndpoint,
		setCNonce,
		setAccessToken,
		setDpopNonce,
		setDpopPrivateKey,
		setDpopPublicKeyJwk,
		setDpopJti,
		setDpopHeader,
		setCredentialIssuerIdentifier,
		execute,
	]);
}
