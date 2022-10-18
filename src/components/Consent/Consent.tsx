import axios from "axios";
import jwtDecode from "jwt-decode";
import Polyglot from "node-polyglot";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import config from "../../config/config.dev";
import './Consent.css';

export const getIssuerMetadata = (): {
		issuer: string,
		authorization_endpoint: string,
		token_endpoint: string,
		credential_endpoint: string,
		credentials_supported: any,
		credential_issuer: {
			id: string,
			display: any[]
		}
	} => {
		const issuerMetadataString: string | null = localStorage.getItem("issuerMetadata");
		if (issuerMetadataString == null) {
			window.location.href = '/';
			throw new Error("No metadata were found");
		}
		return JSON.parse(issuerMetadataString);
	}

interface TokenResponseDTO {
	access_token: string;
	id_token: string;
	token_type: string; //value must be bearer
	expires_in: number; //lifetime in seconds of the token
	c_nonce: string;
}

interface CredentialResponseDTO {
	credential: string;
	c_nonce: string;
	c_nonce_expires_in: number;
}

const Consent: React.FC<{ lang: string, polyglot: Polyglot }> = ({ lang, polyglot }) => {

	const [issuerName, setIssuerName] = useState("");

	const [authCode, setAuthCode] = useState("");

	const [searchParams] = useSearchParams();

	useEffect(() => {
		const displayList = getIssuerMetadata().credential_issuer.display;
		// set issuer name from the Display object
		for (const d of displayList) {
			if (d["locale"].toLowerCase().startsWith(lang)) {
				setIssuerName(d["name"]);
			}
		}
		const authRes = authorizationResponse();
		if (!authRes.ok) {
			// error
		}
		else
			setAuthCode(authRes.code);
	}, [])

	useEffect(() => { // if lang is changed, then update the issuerName
		const displayList = getIssuerMetadata().credential_issuer.display;
		// set issuer name from the Display object
		for (const d of displayList) {
			console.log('d = ', d.locale)
			console.log('lang = ', lang)
			if (d["locale"].toLowerCase().startsWith(lang)) {
				setIssuerName(d["name"]);
			}
		}
	}, [lang]);

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



		let tokenEndpoint = getIssuerMetadata().token_endpoint;
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
				issuerUrl: config.devConformance.usage == true ? config.devIssuer.url : getIssuerMetadata().issuer,
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

		const issuerUrl = getIssuerMetadata().issuer;
		if (issuerUrl == null) {
			window.location.href = '/';
			throw new Error("No issuer url was found");
		}

		let c_nonce = tokenResponse.c_nonce;
		while (1) {
			const getProofJWTRes = await generateProofForNonce(issuerUrl, c_nonce, 'pub');

			if (getProofJWTRes.status !== 200)
				console.log('error');

			const proofJWT: string = getProofJWTRes.data.proof;
			console.log(proofJWT);

			let credentialEndpoint = getIssuerMetadata().credential_endpoint;
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
		
			console.log("Cred res ", credentialResponse);
			const credential = credentialResponse.data.credential;
			console.log("Credential = ", credential)
			console.log('old cnonce = ', c_nonce)

			// get the new c_nonce from the credential response
			c_nonce = credentialResponse.data.c_nonce

			console.log("New cnonce = ", c_nonce)


			// is in conformance mode, then dont store the vc (this will produce errors)
			if (!config.devConformance.usage)
				await axios.post(config.storeBackend.vcStorageUrl + '/vc', { vcjwt: credential }, { headers: { 'authorization': `Bearer ${localStorage.getItem('appToken')}`}});

			// conformance continues to give c_nonce to fetch the same credential
			if (config.devConformance.usage)
				break;
			// if no other c_nonce was provided by the issuer, then stop making Credential Req
			if (c_nonce == undefined)
				break;

		}

		if (!config.devConformance.usage)
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
			<img className="issuerLogo" src={getIssuerMetadata().credential_issuer.display[0]["logo"]} alt="Issuer's logo" height={200}/>
			<h4>{polyglot.t('Consent.description1')} 
				<b><i>{` "${issuerName}" `}</i></b>
				{polyglot.t('Consent.description2')}
			</h4>
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