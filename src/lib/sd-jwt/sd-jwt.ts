import * as jose from 'jose';
import { fromPemToPKIJSCertificate, toPem, validateChain, getPublicKeyFromB64Cert } from '../utils/pki';

export async function verifySdJwtBasedOnTrustAnchors(credential: string) {
	let cred = credential.split('~')[0];

	const { x5c } = JSON.parse(new TextDecoder().decode(jose.base64url.decode(cred.split('.')[0])))
	const chain = x5c.map((c) => {
		const cert = fromPemToPKIJSCertificate(toPem(c));
		return cert;
	});

	const chainValidation = await validateChain(chain, []);
	if (!chainValidation) {
		return false;
	}

	const publicKey = await jose.importX509(getPublicKeyFromB64Cert(x5c[0]), 'ES256');
	try {
		await jose.jwtVerify(cred, publicKey);
		return true;
	} catch (err) {
		console.error('JWT verification failed:', err);
		return false;
	}
}
