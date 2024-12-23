import { useContext } from "react"
import SessionContext from "../../../../context/SessionContext"


export type AccessToken = {
	access_token: string;
	expires_in: number;
	c_nonce: string;
	c_nonce_expires_in: number;
	refresh_token?: string;
}

export enum GetAccessTokenErr {
	NO_TOK_AVAILABLE
}

export function useAccessTokenManager() {

	const { keystore } = useContext(SessionContext);


	async function getAccessToken(credentialIssuerIdentifier: string): Promise<{ at: AccessToken } | { err: GetAccessTokenErr }> {
		// get active access token for keystore.getUserHandle and this credentialIssuerIdentifier by searching the openid4vci client state repo
		// if current access token is valid, return it from the flow state
		// else if refresh token is available
		// then getAccessTokenWithRefreshTokenGrant() and return the token
		// else if authorizatio code currently available then execute getAccessTokenWithAuthorizationCodeGrant() and return it
		// else return GetAccessTokenErr
	}

	function getAccessTokenUsingAuthorizationCodeGrant(credentialIssuerIdentifier: string) {
		// request token using authorization code grant
		// the request will be constructed using the current flowstate
	}


	function getAccessTokenUsingRefreshTokenGrant(credentialIssuerIdentifier: string) {
		// request token using refrhes token grant
		// the request will be constructed using the current flowstate
	}

	return {
		getAccessToken
	}
}