import { useMemo } from "react";
import * as jose from "jose";
import { JWK, SignJWT, importJWK } from "jose";
import { v4 as uuidv4 } from "uuid";
import { SignVerifiablePresentationJWT, WalletKey } from "@gunet/ssi-sdk";
import { util } from '@cef-ebsi/key-did-resolver';

import { verifiablePresentationSchemaURL } from "../constants";
import { useLocalStorage } from "../components/useStorage";


export function useLocalStorageKeystore() {
	const [keys, setKeys] = useLocalStorage<WalletKey | null>("keys", null);

	return useMemo(
		() => ({

			createWallet: async (): Promise<{ alg: string, did: string, publicKey: JWK, verificationMethod: string }> => {
				const alg = "ES256";
				const { publicKey, privateKey } = await jose.generateKeyPair(alg, { extractable: true });

				const publicKeyJWK = await jose.exportJWK(publicKey);
				const privateKeyJWK = await jose.exportJWK(privateKey);

				const did = util.createDid(publicKeyJWK);
				const keys = {
					privateKey: privateKeyJWK,
					publicKey: publicKeyJWK,
					did: did,
					alg: alg,
					verificationMethod: did + "#" + did.split(':')[2]
				};

				setKeys(keys);

				return {
					alg: keys.alg,
					did: keys.did,
					publicKey: keys.publicKey,
					verificationMethod: keys.verificationMethod,
				};
			},

			createIdToken: async (nonce: string, audience: string): Promise<{ id_token: string; }> => {
				const privateKey = await importJWK(keys.privateKey, keys.alg);
				const jws = await new SignJWT({ nonce: nonce })
					.setProtectedHeader({
						alg: keys.alg,
						typ: "JWT",
						kid: keys.did + "#" + keys.did.split(":")[2],
					})
					.setSubject(keys.did)
					.setIssuer(keys.did)
					.setExpirationTime('1m')
					.setAudience(audience)
					.setIssuedAt()
					.sign(privateKey);

				return { id_token: jws };
			},

			signJwtPresentation: async (nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> => {
				const privateKey = await importJWK(keys.privateKey, keys.alg);
				const jws = await new SignVerifiablePresentationJWT()
					.setProtectedHeader({
						alg: keys.alg,
						typ: "JWT",
						kid: keys.did + "#" + keys.did.split(":")[2],
					})
					.setVerifiableCredential(verifiableCredentials)
					.setContext(["https://www.w3.org/2018/credentials/v1"])
					.setType(["VerifiablePresentation"])
					.setAudience(audience)
					.setCredentialSchema(
						verifiablePresentationSchemaURL,
						"FullJsonSchemaValidator2021")
					.setIssuer(keys.did)
					.setSubject(keys.did)
					.setHolder(keys.did)
					.setJti(`urn:id:${uuidv4()}`)
					.setNonce(nonce)
					.setIssuedAt()
					.setExpirationTime('1m')
					.sign(privateKey);
				return { vpjwt: jws };
			},

			generateOpenid4vciProof: async (audience: string, nonce: string): Promise<{ proof_jwt: string }> => {
				const privateKey = await importJWK(keys.privateKey, keys.alg);
				const header = {
					alg: keys.alg,
					typ: "openid4vci-proof+jwt",
					kid: keys.did + "#" + keys.did.split(":")[2]
				};

				const jws = await new SignJWT({ nonce: nonce })
					.setProtectedHeader(header)
					.setIssuedAt()
					.setIssuer(keys.did)
					.setAudience(audience)
					.setExpirationTime('1m')
					.sign(privateKey);
				return { proof_jwt: jws };
			},

		}),
		[keys, setKeys],
	);
}
