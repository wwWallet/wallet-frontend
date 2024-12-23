import { useContext } from "react";
import { AccessToken } from "../AccessTokenManager/AccessTokenManager";
import SessionContext from "../../../../context/SessionContext";
import { useHttpProxy } from "../../HttpProxy/HttpProxy";


export function useCredentialEndpoint() {

	const { keystore } = useContext(SessionContext);
	const httpProxy = useHttpProxy();

	async function sendCredentialRequest(at: AccessToken) {
		// manage cached proofs etc....
		// if credential request fails due to dpop nonce issue, then request again
	}

	return {
		sendCredentialRequest
	}
}