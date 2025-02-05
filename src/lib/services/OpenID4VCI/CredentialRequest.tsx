import { JWK, KeyLike } from "jose";
import { generateDPoP } from "../../utils/dpop";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useOpenID4VCIHelper } from "../OpenID4VCIHelper";
import { useContext, useCallback, useMemo, useRef } from "react";
import SessionContext from "../../../context/SessionContext";
import { VerifiableCredentialFormat } from "../../schemas/vc";

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

		if (!jti) {
			throw new Error("CredentialRequest: jti was not defined");
		}

		const credentialEndpointDPoP = await generateDPoP(
			dpopPrivateKeyRef.current,
			dpopPublicKeyJwk,
			jti,
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

	const execute = useCallback(async (credentialConfigurationId: string, cachedProofs?: any): Promise<{ credentialResponse: any }> => {
		console.log("Executing credential request...");
		const credentialIssuerIdentifier = credentialIssuerIdentifierRef.current;
		const c_nonce = cNonceRef.current;

		const [credentialIssuerMetadata, clientId] = await Promise.all([
			openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
			openID4VCIHelper.getClientId(credentialIssuerIdentifier)
		]);
		let proofsArray: string[] = [];
		const numberOfProofs = credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size ?? 1;
		try {
			const inputs = [];
			for (let i = 0; i < numberOfProofs; i++) {
				inputs.push({
					nonce: c_nonce,
					issuer: clientId.client_id,
					audience: credentialIssuerMetadata.metadata.credential_issuer
				})
			}

			if (cachedProofs) {
				proofsArray = cachedProofs;
			}
			else {
				const [{ proof_jwts }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs(inputs);
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
				proofsArray = proof_jwts;
			}
		}
		catch (err) {
			console.error(err);
			throw new Error("Failed to generate proof");
		}

		const credentialEndpointBody = {
			"format": credentialIssuerMetadata.metadata.credential_configurations_supported[credentialConfigurationId].format,
		} as any;

		if (credentialIssuerMetadata.metadata?.batch_credential_issuance?.batch_size) {
			credentialEndpointBody.proofs = {
				jwt: proofsArray
			}
		}
		else {
			credentialEndpointBody.proof = {
				proof_type: "jwt",
				jwt: proofsArray[0],
			}
		}

		const credentialConfigurationSupported = credentialIssuerMetadata.metadata.credential_configurations_supported[credentialConfigurationId];


		if (credentialConfigurationSupported.format === VerifiableCredentialFormat.SD_JWT_VC && credentialConfigurationSupported.vct) {
			credentialEndpointBody.vct = credentialConfigurationSupported.vct;
		}
		else if (credentialConfigurationSupported.format === VerifiableCredentialFormat.MSO_MDOC && credentialConfigurationSupported.doctype) {
			credentialEndpointBody.doctype = credentialConfigurationSupported.doctype;
		}

		console.log("Credential endpoint body = ", credentialEndpointBody);

		const credentialResponse = await httpProxy.post(credentialEndpointURLRef.current, credentialEndpointBody, httpHeaders);

		if (credentialResponse.err) {
			console.log("Error: Credential response = ", JSON.stringify(credentialResponse.err));
			if (credentialResponse.err.headers["www-authenticate"].includes("invalid_dpop_proof") && "dpop-nonce" in credentialResponse.err.headers) {
				console.log("Calling credentialRequest with new dpop-nonce....")

				setDpopNonce(credentialResponse.err.headers["dpop-nonce"]);
				await setDpopHeader();
				// response.headers['dpop-nonce'] = credentialResponse.err.headers["dpop-nonce"];
				return await execute(credentialConfigurationId, proofsArray);
			}
			throw new Error("Credential Request failed");
		}
		return { credentialResponse };
	}, [api, httpProxy, keystore, openID4VCIHelper, setDpopHeader, setDpopNonce, httpHeaders]);

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
