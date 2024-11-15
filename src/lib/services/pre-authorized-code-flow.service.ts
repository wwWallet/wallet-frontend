import { LocalStorageKeystore } from '../../services/LocalStorageKeystore';
import type { ProxyResponseData } from '../http/proxy-client';
import ProxyClient from '../http/proxy-client';

export const FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';
export const FIELD_PRE_AUTHORIZED_CODE = 'pre-authorized_code';
export const FIELD_USER_PIN_REQUIRED = 'user_pin_required';
const PATH_TOKEN = '/token';

interface TokenResponse {
	accessToken: string;
	cNonce: string;
}

// @todo: Add PIN support
export const getToken = async (credentialIssuer: string, preAuthorizedCode: string): Promise<TokenResponse> => {
	const response = await ProxyClient.post(
		`${credentialIssuer}${PATH_TOKEN}`,
		{
			grant_type: FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE,
			'pre-authorized_code': preAuthorizedCode,
		},
		{
			'Content-Type': 'application/json',
		},
	) as ProxyResponseData;

	const { data } = response;

	const {
		access_token: accessToken,
		c_nonce: cNonce,
	} = data;

	return {
		accessToken,
		cNonce,
	};
};

export const generateNonceProof = async (
	keystore: LocalStorageKeystore,
	nonce: string,
	audience: string,
	issuer: string,
): Promise<{ jws: string }> => {
	const [{ proof_jwts }] = await keystore.generateOpenid4vciProofs([{ nonce, audience, issuer }]);
	return { jws: proof_jwts[0] };
};

export const getCredential = async (
	credentialEndpoint: string,
	accessToken: string,
	jws: string,
	format: string,
	credentialConfiguration: object,
): Promise<any> => {
	const response = await ProxyClient.post(
		credentialEndpoint,
		{
			proof: {
				proof_type: 'jwt',
				jwt: jws,
			},
			format,
			...credentialConfiguration,
		},
		{
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
	) as ProxyResponseData;

	const { data } = response;

	return data;
};

