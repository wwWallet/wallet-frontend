import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import { importJWK, jwtVerify, KeyLike } from "jose";
import jwtDecode from "jwt-decode";
import Polyglot from "node-polyglot";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import { useSearchParams } from "react-router-dom";
import RingLoader from "react-spinners/RingLoader";
import config from "../../config/config.dev";
import { DidDocument, PublicKeyJwk, VerificationMethod } from "../types/DidDocument";
import './Consent.css';
// TODO: move MyModal.css somewhere else
import '../CredentialList/MyModal.css';

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



const override: any = {
	display: "block",
	margin: "0 auto",
	borderColor: "#003476"
};

const ringColor: string = "#003476";

const Consent: React.FC<{ lang: string, polyglot: Polyglot }> = ({ lang, polyglot }) => {

	const [issuerName, setIssuerName] = useState("");

	const [authCode, setAuthCode] = useState("");

	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);

	const [errModal, setErrModal] = useState(false);
	const handleOpenErrModal = () => {
		setErrModal(true);
	}
	const handleCloseErrModal = () => {
		setErrModal(false);
		window.location.href = '/';
	}
	const [err, setErr] = useState("");

	useEffect(() => {
		var displayList;
		try {
			// only need to guard getIssuerMetadata() with try-catch blocks on the two useEffect functions
			// if component mounts and they work, then we assume we are ok later in the function.
			displayList = getIssuerMetadata().credential_issuer.display;
		}
		catch (err) {
			window.location.href = '/error?code=1005';
			return;
		}
		// set issuer name from the Display object
		for (const d of displayList) {
			if (d["locale"].toLowerCase().startsWith(lang)) {
				setIssuerName(d["name"]);
			}
		}
		const authRes = authorizationResponse();
		if (!authRes.ok) {
			setErr('Invalid Authentication Response');
			window.location.href = '/error?code=1004';
			return;
		}
		else
			setAuthCode(authRes.code);
	}, [])

	useEffect(() => { // if lang is changed, then update the issuerName
		var displayList;
		try {
			displayList = getIssuerMetadata().credential_issuer.display;
		}
		catch (err) {
			window.location.href = '/error?code=1005';
			return;
		}
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


		setLoading(true);

		let tokenEndpoint = getIssuerMetadata().token_endpoint;
		if (config.devIssuer.usage) {
			tokenEndpoint = config.devIssuer.tokenEndpoint;
		}
		const params = new URLSearchParams();
		params.append("grant_type", "authorization_code");
		params.append("code", authCode);
		params.append("redirect_uri", config.oid4ci.redirectUri);

		var tokenResponse;
		try {
			tokenResponse = await axios.post<TokenResponseDTO>(tokenEndpoint, params,
				{
					headers: {
						"Conformance": config.devConformance.conformanceHeader,
						"Content-Type": "application/x-www-form-urlencoded"
					}
				}
			);
		}
		catch (err) {
			setErr('Network Error on Token Request');
			window.location.href = '/error?code=1000'
			return;
		}

		console.log("Token response = ", tokenResponse.data)

		if (tokenResponse.status === 200) {
			console.log('tokenRes: ', tokenResponse.data);
			const verifyIssuerResponse = await verifyIssuer(tokenResponse.data.id_token);
			if (verifyIssuerResponse.status === true) {
				await credentialRequest(tokenResponse.data);
			}
			else {
				console.log('Error verifying Issuer Response: ', verifyIssuerResponse.error);
				setErr(verifyIssuerResponse.error);
				handleOpenErrModal();
			}

		}
		else {
			console.log("error");
			setErr(tokenResponse.status.toString());
		}

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
			setErr('No issuer url was found');
			window.location.href = '/error?code=1001';
			return;
		}

		let c_nonce = tokenResponse.c_nonce;
		while (1) {
			const getProofJWTRes = await generateProofForNonce(issuerUrl, c_nonce, 'pub');

			if (getProofJWTRes.status !== 200) {
				console.log('error');
				setErr('Error generating proof for nonce');
				window.location.href = '/error?code=1002';
				return;
			}

			const proofJWT: string = getProofJWTRes.data.proof;
			console.log(proofJWT);

			let credentialEndpoint = getIssuerMetadata().credential_endpoint;
			if (config.devIssuer.usage) {
				credentialEndpoint = config.devIssuer.credentialEndpoint;
			}

			var credentialResponse;
			try {
				credentialResponse = await axios.post<CredentialResponseDTO>(credentialEndpoint,
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
			}
			catch (err) {
				setErr('Network Error on Credential Request');
				window.location.href = '/error?code=1003';
				return;
			}

			console.log("Cred res ", credentialResponse);
			const credential = credentialResponse.data.credential;

			const verifyIssuerRes = await verifyIssuerFromCredential(credential);
			if (verifyIssuerRes.status != true) {
				setErr('error verifying issuer' + verifyIssuerRes.error);
				window.location.href = '/error?code=1006';
				return;
			}

			console.log("Credential = ", credential)
			console.log('old cnonce = ', c_nonce)

			// get the new c_nonce from the credential response
			c_nonce = credentialResponse.data.c_nonce

			console.log("New cnonce = ", c_nonce)


			// is in conformance mode, then dont store the vc (this will produce errors)
			if (!config.devConformance.usage)
				await axios.post(config.storeBackend.vcStorageUrl + '/vc', { vcjwt: credential }, { headers: { 'authorization': `Bearer ${localStorage.getItem('appToken')}` } });

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

	const verifyIssuer = async (id_token: string): Promise<{ status: boolean, error: string }> => {

		var decoded_header: any;
		try {
			decoded_header = jwtDecode(id_token, { header: true }) as any;
		}
		catch {
			return { status: false, error: 'error decoding jwt header' };
		}

		if (decoded_header.alg == undefined)
			return { status: false, error: 'alg not included in jwt header' };
		if (decoded_header.kid == undefined)
			return { status: false, error: 'kid not included in jwt header' };

		// 1. Find kid
		const alg: string = decoded_header.alg;
		const kid: string = decoded_header.kid;
		const did: string = kid.split('#')[0];

		// TODO: Verifying Issuer loading...
		// Modal OK
		// Modal CAUTION! Issuer not trusted, returning...


		// 2. Seek TIR to check if did belongs to a Trusted Issuer
		var searchIssuerInTIR;
		try {
			searchIssuerInTIR = await axios.get(`${config.ebsi.tirRegistryUrl}/${did}`);
		}
		catch (err) {
			return { status: false, error: 'Network Error querying TIR' };
		}

		if (searchIssuerInTIR.status == 404)
			return { status: false, error: 'DID does not belong to a Trusted Issuer' };

		else if (searchIssuerInTIR.status !== 200)
			return { status: false, error: 'Error checking if DID belongs to a Trusted Issuer' };

		// 3. Seek DID Registry to get DID Document
		var getDidDocument;
		try {
			getDidDocument = await axios.get<DidDocument>(`${config.ebsi.didRegistryUrl}/${did}`);
		}
		catch (err) {
			return { status: false, error: 'Network Error querying DID Document Registry' };
		}

		if (getDidDocument.status == 404)
			return { status: false, error: 'DID document not found in DID Registry' };

		else if (getDidDocument.status !== 200)
			return { status: false, error: 'Error fetching DID document from DID Registry' };

		const didDocument = getDidDocument.data;

		// 4. Find public key from did document based on kid
		var publicKeyJwk: PublicKeyJwk = {};

		// 4.1. get correct method
		const methods: VerificationMethod[] = didDocument.verificationMethod;
		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			if (method.id === kid) {
				publicKeyJwk = method.publicKeyJwk;
				break;
			}
		}

		// 4.2. Transform jwk to KeyLike
		const key = await importJWK(publicKeyJwk, alg);

		// 5. Verify JWT:
		// 	5.1. aud must be same as our redirectUri
		// 	5.2. iss must be same as our issuer metadata
		try {
			await jwtVerify(id_token, key, {
				audience: config.oid4ci.redirectUri,
				issuer: getIssuerMetadata().issuer
			})
		}
		catch (err) {
			console.log('verification error: ', err);
			return { status: false, error: (err as any).toString() }
		}

		console.log('verification OK!');
		return { status: true, error: '' };
	}

	const verifyIssuerFromCredential = async (credential: string): Promise<{ status: boolean, error: string }> => {
		// verify issuer -> take vc, check issuer did = kid, kid, alg (no aud)
		// payload sub == localstorage holder did
		console.log('credential: ', credential);

		var decoded_header: any;
		// var decoded_payload: any;
		try {
			decoded_header = jwtDecode(credential, { header: true }) as any;
			// decoded_payload = jwtDecode(credential, { header: false }) as any;
		}
		catch {
			return { status: false, error: 'error decoding jwt' };
		}

		if (decoded_header.alg == undefined)
			return { status: false, error: 'alg not included in jwt header' };
		if (decoded_header.kid == undefined)
			return { status: false, error: 'kid not included in jwt header' };
		if (decoded_header.typ !== 'JWT')
			return { status: false, error: 'credential type is not JWT' };

		// 1. Find kid
		const alg: string = decoded_header.alg;
		const kid: string = decoded_header.kid;
		const did: string = kid.split('#')[0];

		// 2. Seek TIR to check if did belongs to a Trusted Issuer
		var searchIssuerInTIR;
		try {
			searchIssuerInTIR = await axios.get(`${config.ebsi.tirRegistryUrl}/${did}`);
		}
		catch (err) {
			return { status: false, error: 'Network Error querying TIR' };
		}

		if (searchIssuerInTIR.status == 404)
			return { status: false, error: 'DID does not belong to a Trusted Issuer' };

		else if (searchIssuerInTIR.status !== 200)
			return { status: false, error: 'Error checking if DID belongs to a Trusted Issuer' };

		// 3. Seek DID Registry to get DID Document
		var getDidDocument;
		try {
			getDidDocument = await axios.get<DidDocument>(`${config.ebsi.didRegistryUrl}/${did}`);
		}
		catch (err) {
			return { status: false, error: 'Network Error querying DID Document Registry' };
		}

		if (getDidDocument.status == 404)
			return { status: false, error: 'DID document not found in DID Registry' };

		else if (getDidDocument.status !== 200)
			return { status: false, error: 'Error fetching DID document from DID Registry' };

		const didDocument = getDidDocument.data;

		// 4. Find public key from did document based on kid
		var publicKeyJwk: PublicKeyJwk = {};

		// 4.1. get correct method
		const methods: VerificationMethod[] = didDocument.verificationMethod;
		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			if (method.id === kid) {
				publicKeyJwk = method.publicKeyJwk;
				break;
			}
		}

		// 4.2. Transform jwk to KeyLike
		var key: KeyLike | Uint8Array;
		try {
			key = await importJWK(publicKeyJwk, alg);
		}
		catch (err) {
			return { status: false, error: 'Error decoding JWK. Perhaps algorithm is not supported. Details: ' + (err as any).toString };
		}

		// 5. Verify JWT:
		// 	5.1. issuer did must be same as the kid
		// 	5.2. subject did must be same as our local storage user did

		const localUserDid: string | null = localStorage.getItem('did');
		var userDid: string;
		if (typeof localUserDid == 'string')
			userDid = localUserDid;
		else {
			console.log('user did not found in local storage');
			return { status: false, error: 'user did not found in local storage' };
		}


		try {
			await jwtVerify(credential, key, {
				issuer: did,
				// subject: userDid
			})
		}
		catch (err) {
			console.log('verification error: ', err);
			return { status: false, error: (err as any).toString() }
		}

		console.log('verification OK!');
		return { status: true, error: '' };
	}


	return (
		<>
			{!loading
				?
				<div className="gunet-container">
					<h1>{polyglot.t('Consent.title')}</h1>
					<img className="issuerLogo" src={getIssuerMetadata().credential_issuer.display[0]["logo"]} alt="Issuer's logo" height={200} />
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
				:
				<div className="gunet-container Loading">
					<div className='recenter'>
						<h2>{polyglot.t('Consent.VerifyIssuerLoadingScreen')}</h2>
					</div>
					<RingLoader color={ringColor} loading={true} css={override} size={300} speedMultiplier={0.3} />
				</div>}
			<Modal
				className="my-modal"
				overlayClassName="my-modal-wrapper"
				isOpen={errModal}
				ariaHideApp={false}
				onRequestClose={handleCloseErrModal}
			>
				<div className="modal-fail header">
					<h4>{polyglot.t('Consent.errorTitle')}</h4>
					<button type="button" onClick={handleCloseErrModal}>
						<FontAwesomeIcon className="CloseModal" icon={faTimes} />
					</button>
				</div>
				<div className='content'>
					<p>{polyglot.t('Consent.errorMsg')}</p>
					<p>{polyglot.t('Consent.errorMsg2')}</p>
					<p>{err}</p>
					<p>{polyglot.t('Consent.errorMsg3')}</p>
				</div>
			</Modal>
		</>
	);
}

export default Consent;