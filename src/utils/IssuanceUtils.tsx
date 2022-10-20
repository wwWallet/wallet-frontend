import config from "../config/config.dev";
import axios, { AxiosResponse } from "axios";
import { importJWK, jwtVerify, KeyLike } from "jose";
import jwtDecode from "jwt-decode";
import { DidDocument, PublicKeyJwk, VerificationMethod } from "../components/types/DidDocument";
import { CredentialRequestErrorResult, CredentialRequestSuccessResult, CredentialResponseDTO, TokenRequestErrorResult, TokenRequestSuccessResult, TokenResponseDTO } from "../interfaces/Issuance-dto";
import { IssuerMetadata } from "../interfaces/IssuerMetadata";

export const getIssuerMetadata = (): IssuerMetadata => {
	const issuerMetadataString: string | null = localStorage.getItem("issuerMetadata");
	if (issuerMetadataString == null) {
		throw new Error("No metadata were found");
	}
	try {
		const issuerMetadata: IssuerMetadata = JSON.parse(issuerMetadataString);
		return issuerMetadata;
	}
	catch (err) {
		throw new Error("Error parsing metadata: " + err);
	}
}


export const authorizationRequest = (issuerUrl: string): { redirectUrl?: URL, errCode: number } => {

	const state: string = "secret";
	localStorage.setItem('state', state);

	localStorage.setItem('issuerUrl', issuerUrl);

	// this endpoint is meant to be fetched from the server metadata, once we know the server metadata url of the issuer
	let authorizationEndpoint;
	try {
		authorizationEndpoint = getIssuerMetadata().authorization_endpoint;
	}
	catch (err) {
		return { errCode: 1005 };
	}
	if (config.devIssuer.usage == true) {
		authorizationEndpoint = config.devIssuer.authorizationEndpoint;
	}

	var redirectUrl: URL;
	try {

		redirectUrl = new URL(authorizationEndpoint);

		redirectUrl.searchParams.append('response_type', 'code');
		redirectUrl.searchParams.append('client_id', config.oid4ci.redirectUri);
		redirectUrl.searchParams.append('state', state);
		if (config.devConformance.usage == true)
			redirectUrl.searchParams.append('authorization_details', config.devConformance.authorization_details);
		else
			redirectUrl.searchParams.append('authorization_details', `%5B%7B%22type%22%3A%22openid_credential%22%2C%22credential_type%22%3A%22https%3A%2F%2Fapi.preprod.ebsi.eu%2Ftrusted-schemas-registry%2Fv1%2Fschemas%2F0x1ee207961aba4a8ba018bacf3aaa338df9884d52e993468297e775a585abe4d8%22%2C%22format%22%3A%22jwt_vc%22%7D%5D`);
		redirectUrl.searchParams.append('redirect_uri', config.oid4ci.redirectUri);
		redirectUrl.searchParams.append('scope', 'openid');
		// window.location.replace(redirectUrl);
		console.log('URL = ', redirectUrl.toString())
		// window.location.replace(redirectUrl);

	}
	catch (err) {
		console.log('Error creating redirectUrl. Check your config. Details: ', err);
		return { errCode: 1006 };
	}

	// fetch(redirectUrl, {
	// 	headers: {Conformance: config.devConformance.conformanceHeader}
	// }).then(res => {
	// 	console.log("Result = ", res)
	// 	window.location.href = res.url
	// })

	return { redirectUrl: redirectUrl, errCode: 0 };
}


export const tokenRequest = async (authCode: string): Promise<TokenRequestSuccessResult | TokenRequestErrorResult> => {

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
		return { success: false, errorCode: 1000 };
	}

	if (tokenResponse.status === 200) {
		return { success: true, tokenResponse: tokenResponse.data };
	}
	else {
		console.log("token request error");
		return { success: false, errorCode: 1000 };
	}

}


export const credentialRequest = async (tokenResponse: TokenResponseDTO): Promise<CredentialRequestSuccessResult | CredentialRequestErrorResult> => {

	const issuerUrl = getIssuerMetadata().issuer;
	if (issuerUrl == null) {
		return { success: false, errorCode: 1002 };
	}

	let c_nonce = tokenResponse.c_nonce;
	while (1) {	// Loop for Credential Chaining
		const getProofJWTRes = await generateProofForNonce(issuerUrl, c_nonce, 'pub');

		if (getProofJWTRes.status !== 200) {
			return { success: false, errorCode: 1003 };
		}

		const proofJWT: string = getProofJWTRes.data.proof;

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
			// setErr('Network Error on Credential Request');
			return { success: false, errorCode: 1004 };
		}

		const credential = credentialResponse.data.credential;

		const verifyIssuerRes = await verifyIssuerFromCredential(credential);
		if (verifyIssuerRes.status != true) {
			return { success: false, errorCode: 1007, errorText: verifyIssuerRes.error };
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

	return { success: true };

}


export const generateProofForNonce = async (issuerUrl: string, c_nonce: string, rsaPublicKey: any): Promise<AxiosResponse<{ proof: string }, any>> => {
	return await axios.post<{ proof: string }>(
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


export const verifyState = (state: string): boolean => {
	return (state === localStorage.getItem('state'));
}


export const verifyIssuer = async (id_token: string): Promise<{ status: boolean, error: string }> => {

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
		console.log('Issuer verification error: ', err);
		return { status: false, error: (err as any).toString() }
	}

	console.log('Issuer verification OK!');
	return { status: true, error: '' };
}


export const verifyIssuerFromCredential = async (credential: string): Promise<{ status: boolean, error: string }> => {

	var decoded_header: any;
	try {
		decoded_header = jwtDecode(credential, { header: true }) as any;
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
		console.log('Credential verification error: ', err);
		return { status: false, error: (err as any).toString() }
	}

	console.log('Credential verification OK!');
	return { status: true, error: '' };
}