import axios from "axios";
import { importJWK, jwtVerify } from "jose";
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
			const verifyIssuerResponse = await verifyIssuer(tokenResponse.data.id_token);
			if (verifyIssuerResponse.status === false) {
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

	const verifyIssuer = async (id_token: string): Promise<{status: boolean, error?: string}> => {

		console.log('id token: ', id_token);

		var decoded_header: any;
		try {
		 decoded_header = jwtDecode(id_token,{header: true}) as any;
		}
		catch {
			return {status: false, error: 'error decoding jwt header'};
		}

		if (decoded_header.alg != undefined)
			return {status: false, error: 'alg not included in jwt header'};
		if (decoded_header.kid != undefined)
			return {status: false, error: 'kid not included in jwt header'};

		// 1. Find kid
		const alg: string = decoded_header.alg;
		const kid: string = decoded_header.kid;
		const did: string = kid.split('#')[0];

		// check if issuer
		// TODO: ADD TIR REGISTRY TO CONFIG
		// TODO: Verifying Issuer loading...
		// Modal OK
		// Modal CAUTION! Issuer not trusted, returning...


		// 2. Seek TIR to check if did belongs to a Trusted Issuer
		const tirRegistryUrl: string = 'https://api.preprod.ebsi.eu/trusted-issuers-registry/v3/issuers/'
		const didRegistryUrl: string = 'https://api.preprod.ebsi.eu/did-registry/v3/identifiers/'

		const checkIfIssuerRes = await axios.get(tirRegistryUrl+did);
		if (!checkIfIssuerRes) { // if res status != 200
			// return err did is not a trusted issuer
			return {status: false, error: ''}
		}

		const getDidDocRes = await axios.get(didRegistryUrl+did);
		if (!getDidDocRes) { // if res status != 200
			// return err cannot get did document
			return {status: false, error: ''}
		}

		console.log('diddocres: ', getDidDocRes.data);

		const diddoc = getDidDocRes.data;
		var publicKeyJwk: any = {};
		// get correct method
		const methods: any[] = diddoc.verificationMethod;
		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			if(method.id === kid) {
				publicKeyJwk = method.publicKeyJwk;
				break;
			}
		}

		console.log('pkjwk: ', publicKeyJwk);

		// import jwk (transform jwk to keylike)
		const key = await importJWK(publicKeyJwk, alg);

		console.log('key ====== ', key);

		try {
			await jwtVerify(id_token, key, {
				audience: config.oid4ci.redirectUri,
				issuer: getIssuerMetadata().issuer
			})
		}
		catch(err) {
			console.log('verification error: ', err);
			// err  verifying jwt
			return {status: false, error: ''}
		}

		console.log('verification OK!');
		return {status: true, error: ''};
		// const kid: string = tokenResponse.id_token;

		// id_token: jwt pou periexei to iss (issuer did)
		// 1. find kid from token response.id_token
		// 2. get issuer's public key (based on kid) from did registry using issuer's did (from local storage)
		// 3. importJwk
		// 4. jose.verifyJwt
		// ----!5. verify jwt.iss (only if tir registry contains issuer URL)

		// υπογεγραμμενο με ES256 (to ES256K δεν υποστηριζεται απο browser)
		// find kid
		// seek tir to check if it's an issuer
		// seek did registry to get did document (by given did with given key)
		// find public key based on kid
		
		// importjwk -> transform jwk to keylike
		// verify it using jose


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