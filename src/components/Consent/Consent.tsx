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
		console.log('coode', authCode);
		const tokenResponse = await axios.post<TokenResponseDTO>(`${localStorage.getItem('issuerUrl')}/issuer/token`,
			{
				grant_type: "authorisation_code",
				code: authCode,
				code_verifier: generateCodeVerifier(),
				redirect_uri: config.oid4ci.redirectUri
			}
		);

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

	const credentialRequest = async (tokenResponse: TokenResponseDTO) => {

		const getProofJWTRes = await axios.post(
			`${config.signatoryBackend.url}/issuance/construct/proof`,
			{
				issuerDID: localStorage.getItem('issuerDid'),
				c_nonce: tokenResponse.c_nonce,
				rsaPublicKey: "secret"
			},
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`
				}
			}
		);

		if (getProofJWTRes.status !== 200)
			console.log('error');

		const proofJWT: string = getProofJWTRes.data.proof;
		console.log(proofJWT);

		const credentialResponse = await axios.post<CredentialResponseDTO>(`${localStorage.getItem('issuerUrl')}/issuer/credential`,
			{
				type: tokenResponse.token_type,
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

	const getPublicKey = async () => {
		const getPubKeyRes = await axios.get(`${config.signatoryBackend.url}/user/keys/public?alg=es256k`,
			{
				headers: {
					'authorization': `Bearer ${localStorage.getItem('appToken')}`
				}
			})

		// to pairnw se morfh publicjwk
		return getPubKeyRes.data;
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