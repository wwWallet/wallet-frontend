import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { digest } from '@sd-jwt/crypto-browser';

export const getSDJwtVcInstanceWithHasher = () => {
	return new SDJwtVcInstance({
		hasher: digest,
		hashAlg: 'SHA-256'
	});
}

export const getClaims = async (credential: string) => {
	const sdJwt = getSDJwtVcInstanceWithHasher();
	return await sdJwt.getClaims(credential);
}
