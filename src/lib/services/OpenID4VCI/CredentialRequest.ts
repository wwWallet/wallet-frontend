import { JWK, KeyLike } from "jose";
import { generateDPoP } from "../../utils/dpop";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useOpenID4VCIHelper } from "../OpenID4VCIHelper";
import { useContext, useCallback, useMemo, useRef, useEffect, useState } from "react";
import SessionContext from "@/context/SessionContext";
import { VerifiableCredentialFormat } from "../../schemas/vc";
import { OPENID4VCI_PROOF_TYPE_PRECEDENCE } from "../../../config";
import { OpenidCredentialIssuerMetadata } from "wallet-common";
import CredentialsContext from "@/context/CredentialsContext";
import { WalletStateOperations } from "@/services/WalletStateOperations";
import { WalletStateUtils } from "@/services/WalletStateUtils";

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
	const credentialConfigurationIdRef = useRef<string | null>(null);
	const [receivedCredentialsArray, setReceivedCredentialsArray] = useState<string[] | null>(null);
	const { getData } = useContext<any>(CredentialsContext);

	const credentialIssuerMetadataRef = useRef<{ metadata: OpenidCredentialIssuerMetadata } | null>(null);

	const requestKeyAttestation = async (jwks: JWK[], nonce: string) => {
		try {
			const response = await api.post("/wallet-provider/key-attestation/generate", {
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
	}

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

	const setCredentialConfigurationId = useCallback((id: string) => {
		credentialConfigurationIdRef.current = id;
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

		const [credentialIssuerMetadata, clientId ] = await Promise.all([
			openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
			openID4VCIHelper.getClientId(credentialIssuerIdentifier),
		]);

		const credentialEndpointBody = {
			"format": credentialIssuerMetadata.metadata.credential_configurations_supported[credentialConfigurationId].format,
		} as any;
		const numberOfProofs = credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size ?? 1;
		let proofs: {
			nonce: string,
			issuer: string,
			audience: string
		}[] | null = null;
		let keyAttestation: string | null = null;

		try {
			if (proofType === "jwt") {
				const inputs = [];
				for (let i = 0; i < numberOfProofs; i++) {
					inputs.push({
						nonce: c_nonce,
						issuer: clientId.client_id,
						audience: credentialIssuerMetadata.metadata.credential_issuer
					})
				}
				proofs = inputs;
			}
			else if (proofType === "attestation") {
				const numberOfKeypairsToGenerate = credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size ?? 1;
				const [{ keypairs }, newPrivateData, keystoreCommit] = await keystore.generateKeypairs(numberOfKeypairsToGenerate);
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
				const publicKeys = keypairs.map(kp => kp.publicKey);

				const requestKeyAttestationResponse = await requestKeyAttestation(publicKeys, c_nonce);
				if (!requestKeyAttestationResponse) {
					throw new Error("Failed to get key attestation from wallet-backend-server");
				}
				keyAttestation = requestKeyAttestationResponse.key_attestation;
			}

			if (proofs) {
				const [{ proof_jwts }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs(proofs);
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
				if (credentialIssuerMetadata.metadata?.batch_credential_issuance?.batch_size) {
					credentialEndpointBody.proofs = {
						jwt: proof_jwts
					}
				}
				else {
					credentialEndpointBody.proof = {
						proof_type: "jwt",
						jwt: proof_jwts[0]
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


		const credentialConfigurationSupported = credentialIssuerMetadata.metadata.credential_configurations_supported[credentialConfigurationId];
		credentialIssuerMetadataRef.current = credentialIssuerMetadata;

		if (credentialConfigurationSupported.format === VerifiableCredentialFormat.SD_JWT_VC && credentialConfigurationSupported.vct) {
			credentialEndpointBody.vct = credentialConfigurationSupported.vct;
		}
		else if (credentialConfigurationSupported.format === VerifiableCredentialFormat.MSO_MDOC && credentialConfigurationSupported.doctype) {
			credentialEndpointBody.doctype = credentialConfigurationSupported.doctype;
		}

		console.log("Credential endpoint body = ", credentialEndpointBody);

		const credentialResponse = await httpProxy.post(credentialEndpointURLRef.current, credentialEndpointBody, httpHeaders);

		if (credentialResponse.status !== 200) {
			console.error("Error: Credential response = ", JSON.stringify(credentialResponse));
			if (credentialResponse.headers?.["www-authenticate"] && (credentialResponse.headers?.["www-authenticate"] as string).includes("invalid_dpop_proof") && "dpop-nonce" in credentialResponse.headers) {
				console.log("Calling credentialRequest with new dpop-nonce....")

				setDpopNonce(credentialResponse.headers?.["dpop-nonce"] as string);
				await setDpopHeader();
				// response.headers['dpop-nonce'] = credentialResponse.err.headers["dpop-nonce"];
				return await execute(credentialConfigurationId, proofType, proofs);
			}
			throw new Error("Credential Request failed");
		}

		const credentialResponseData = credentialResponse.data as Record<string, unknown>;
		if (!('credential' in credentialResponseData) && !('credentials' in credentialResponseData)) {
			return;
		}

		const credentialArray: string[] = credentialResponseData.credential ?
			[credentialResponseData.credential as string] :
			[...(credentialResponseData as { credentials: string[] }).credentials];

		setReceivedCredentialsArray(credentialArray);
		// receivedCredentialsArrayRef.current = credentialArray;
		console.log("Received credentials array = ", credentialArray)
		console.log("Credential response: ", credentialResponse);
		return { credentialResponse };
	}, [api, httpProxy, keystore, openID4VCIHelper, setDpopHeader, setDpopNonce, httpHeaders]);

	useEffect(() => {
		if (!receivedCredentialsArray || !keystore) {
			return;
		}

		const batchId = WalletStateUtils.getRandomUint32();
		// wait for keystore update before commiting the new credentials
		(async () => {
			try {
				const [, privateData, keystoreCommit] = await keystore.addCredentials(receivedCredentialsArray.map((credential, index) => {
					return {
						data: credential,
						format: credentialIssuerMetadataRef.current.metadata.credential_configurations_supported[credentialConfigurationIdRef.current].format,
						credentialConfigurationId: credentialConfigurationIdRef.current,
						credentialIssuerIdentifier: credentialIssuerMetadataRef.current.metadata.credential_issuer,
						batchId: batchId,
						sigCount: 0,
						instanceId: index,
					}
				}));
				console.log("Private data len = ", privateData.jwe.length)

				await api.updatePrivateData(privateData);
				await keystoreCommit();
				getData(false);
				setReceivedCredentialsArray(null);
			}
			catch (err) {
				throw err;
			}
		})();
	}, [keystore, receivedCredentialsArray, getData])

	return useMemo(() => ({
		setCredentialEndpoint,
		setCNonce,
		setAccessToken,
		setDpopNonce,
		setDpopPrivateKey,
		setDpopPublicKeyJwk,
		setDpopJti,
		setCredentialConfigurationId,
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
		setCredentialConfigurationId,
		setDpopHeader,
		setCredentialIssuerIdentifier,
		execute,
	]);
}
