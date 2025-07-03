import { JWK, KeyLike, SignJWT } from "jose";
import { generateRandomIdentifier } from "./generateRandomIdentifier";

export async function generateDPoP(privateKey: KeyLike, publicKeyJwk: JWK, targetMethod: string, targetUri: string, nonce?: string, access_token?: string) {
	return new SignJWT({
		"jti": generateRandomIdentifier(8),
		"htm": targetMethod,
		"htu": targetUri,
		"nonce": nonce,
		"ath": access_token ? await calculateAth(access_token) : undefined,
	})
		.setIssuedAt()
		.setProtectedHeader({
			"typ": "dpop+jwt",
			"alg": "ES256",
			"jwk": publicKeyJwk,
		})
		.sign(privateKey);
}

export async function calculateAth(accessToken: string) {
	// Encode the access token as a Uint8Array
	const encoder = new TextEncoder();
	const accessTokenBuffer = encoder.encode(accessToken);

	// Compute the SHA-256 hash of the access token
	const hashBuffer = await crypto.subtle.digest('SHA-256', accessTokenBuffer);

	// Convert ArrayBuffer to Base64URL string
	const base64Url = arrayBufferToBase64Url(hashBuffer);

	return base64Url;
}

function arrayBufferToBase64Url(buffer) {
	const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
	const base64Url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return base64Url;
}
