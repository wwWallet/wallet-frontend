import axios from "axios";
import jwtDecode from "jwt-decode";
import Polyglot from "node-polyglot";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import config from "../../config/config.dev";

interface TokenResponseDTO {
	access_token: string;
	id_token: string;
	token_type: string; //value must be bearer
	expires_in: number; //lifetime in seconds of the token
	c_nonce: string;
}

interface CredentialResponseDTO {
	credential: string;
}

const Consent: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [issuerName, setIssuerName] = useState("issuer");

	const [authCode, setAuthCode] = useState("");

	const [searchParams] = useSearchParams();

	useEffect(() => {
		const authRes = authorizationResponse();
		if (!authRes.ok) {
			// error
		}
		else
			setAuthCode(authRes.code);
	}, [])

	const authorizationResponse = (): { ok: boolean, code: string } => {
		const code = searchParams.get('code');
		const state = searchParams.get('state');

		if (code === null)
			return { ok: false, code: "" };

		if (state !== null && verifyState(state))
			return { ok: true, code: code };
		else {
			return { ok: false, code: "" };
		}
	}

	const verifyState = (state: string): boolean => {
		return (state === localStorage.getItem('state'));
	}

	const tokenRequest = async (): Promise<void> => {
		console.log('code = ', authCode);
		let tokenEndpoint = "";
		if (config.devIssuer.usage) {
			tokenEndpoint = config.devIssuer.tokenEndpoint;
		}

		const params = new URLSearchParams();
		params.append("grant_type", "authorization_code");
		params.append("code", authCode);
		params.append("redirect_uri", config.oid4ci.redirectUri);

		const tokenResponse = await axios.post<TokenResponseDTO>(tokenEndpoint, params,
			{
				headers: {
					"Conformance": config.devConformance.conformanceHeader,
					"Content-Type": "application/x-www-form-urlencoded"
				}
			}
		);
		console.log("Token response = ", tokenResponse.data)

		if (tokenResponse.status === 200) {
			console.log('tokenRes: ', tokenResponse.data);
			if (await verifyIssuer(tokenResponse.data.id_token) === false) {
				console.log('error');
			}
			await credentialRequest(tokenResponse.data);
		}
		else
			console.log("error");

	}

	const generateCodeVerifier = (): string => {
		return "secret";
	}


	const generateProofForNonce = async (issuerUrl: string, c_nonce: string, rsaPublicKey: any) => {
		return await axios.post(
			`${config.signatoryBackend.url}/issuance/construct/proof`,
			{
				issuerUrl: issuerUrl,
				c_nonce: c_nonce,
				rsaPublicKey: rsaPublicKey 
			},
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`,
					Conformance: config.devConformance.conformanceHeader
				}
			}
		);
	}
	const credentialRequest = async (tokenResponse: TokenResponseDTO) => {

		const issuerUrl = localStorage.getItem('issuerUrl');
		if (issuerUrl == null) {
			throw new Error("No issuer url was found");
		}
		const getProofJWTRes = await generateProofForNonce(issuerUrl, tokenResponse.c_nonce, 'pub');

		if (getProofJWTRes.status !== 200)
			console.log('error');

		const proofJWT: string = getProofJWTRes.data.proof;
		console.log(proofJWT);

		let credentialEndpoint = "";
		if (config.devIssuer.usage) {
			credentialEndpoint = config.devIssuer.credentialEndpoint;
		}
		const credentialResponse = await axios.post<CredentialResponseDTO>(credentialEndpoint,
			{
				type: config.devConformance.credential_type,
				format: "jwt_vc",
				proof: {
					proof_type: "jwt",
					jwt: proofJWT
				}
			},
			{
				headers: {
					'authorization': `Bearer ${tokenResponse.access_token}`
				}
			}
		);

		console.log(credentialResponse);
		const credential = credentialResponse.data.credential;
		console.log("Credential = ", credential)

		axios.post(config.storeBackend.vcStorageUrl + '/vc', { vcjwt: credential }, { headers: { 'authorization': `Bearer ${localStorage.getItem('appToken')}`}});
		window.location.href = '/';
	}

	const verifyIssuer = async (id_token: string): Promise<boolean> => {

		const decoded_id_token = jwtDecode(id_token);
		console.log(decoded_id_token)
		return true;
		// const kid: string = tokenResponse.id_token;

		// id_token: jwt pou periexei to iss (issuer did)
		// 1. find kid from token response.id_token
		// 2. get issuer's public key (based on kid) from did registry using issuer's did (from local storage)
		// 3. importJwk
		// 4. jose.verifyJwt
		// 5. verify jwt.iss
	}


	return (
		<div className="gunet-container">
			<h1>{polyglot.t('Consent.title')}</h1>
			<h4>{polyglot.t('Consent.description1')} {issuerName} {polyglot.t('Consent.description2')}</h4>
			<button
				className="small login-button ui fancy button"
				onClick={tokenRequest}>
				{polyglot.t('Consent.buttonConsent')}
			</button>
			<button
				className="small login-button ui fancy button"
				onClick={() => { }}>
				{polyglot.t('Consent.buttonDecline')}
			</button>
		</div>
	);
}

export default Consent;