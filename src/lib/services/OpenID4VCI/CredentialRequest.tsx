import { JWK, KeyLike } from "jose";
import { generateDPoP } from "../../utils/dpop";
import { useHttpProxy } from "../HttpProxy/HttpProxy";
import { useOpenID4VCIHelper } from "../OpenID4VCIHelper";
import { useContext } from "react";
import SessionContext from "../../../context/SessionContext";
import { VerifiableCredentialFormat } from "../../schemas/vc";


export function useCredentialRequest() {
	const httpProxy = useHttpProxy();
	const openID4VCIHelper = useOpenID4VCIHelper();
	const { keystore, api } = useContext(SessionContext);

	let credentialEndpointURL = null;
	let access_token = null;
	let c_nonce = null;
	let dpop_nonce = null;

	let dpopPrivateKey: KeyLike;
	let dpopPublicKeyJwk: JWK;
	let jti: string;

	let credentialIssuerIdentifier: string;

	const httpHeaders = {
		'Content-Type': 'application/json',
	};

	function setCredentialEndpoint(endpoint: string) {
		credentialEndpointURL = endpoint;
	}

	function setCNonce(cNonce: string) {
		c_nonce = cNonce;
	}

	function setAccessToken(at: string) {
		access_token = at;
		httpHeaders['Authorization'] = `Bearer ${access_token}`;
	}

	function setDpopNonce(dpopNonce: string) {
		dpop_nonce = dpopNonce;
	}

	function setDpopPrivateKey(sk: KeyLike) {
		dpopPrivateKey = sk;
	}

	function setDpopPublicKeyJwk(jwk: JWK) {
		dpopPublicKeyJwk = jwk;
	}

	function setDpopJti(id: string) {
		jti = id;
	}


	async function setDpopHeader() {
		if (!credentialEndpointURL) {
			throw new Error("CredentialRequest: credentialEndpointURL was not defined");
		}

		if (!dpopPublicKeyJwk) {
			throw new Error("CredentialRequest: dpopPublicKeyJwk was not defined");
		}

		if (!jti) {
			throw new Error("CredentialRequest: jti was not defined");
		}

		const credentialEndpointDPoP = await generateDPoP(
			dpopPrivateKey,
			dpopPublicKeyJwk,
			jti,
			"POST",
			credentialEndpointURL,
			dpop_nonce,
			access_token
		);

		httpHeaders['Authorization'] = `DPoP ${access_token}`;
		httpHeaders['dpop'] = credentialEndpointDPoP;
	}

	function setCredentialIssuerIdentifier(id: string) {
		credentialIssuerIdentifier = id;
	}

	async function execute(credentialConfigurationId: string, cachedProofs?: any): Promise<{ credentialResponse: any }> {
		console.log("Executing credential request...");
		const [authzServerMetadata, credentialIssuerMetadata, clientId] = await Promise.all([
			openID4VCIHelper.getAuthorizationServerMetadata(credentialIssuerIdentifier),
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

		const credentialResponse = await httpProxy.post(credentialEndpointURL, credentialEndpointBody, httpHeaders);

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
	}

	return {
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
	}
}
