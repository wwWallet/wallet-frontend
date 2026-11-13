import {
	calculateJwkThumbprint,
	compactDecrypt,
	CompactDecryptResult,
	CompactEncrypt,
	CompactJWEHeaderParameters,
	decodeJwt,
	exportJWK,
	generateKeyPair,
	importJWK,
	JWK,
	KeyLike,
	SignJWT,
} from 'jose';
import { generateDPoP } from '../../utils/dpop';
import { useHttpProxy } from '../HttpProxy/HttpProxy';
import { useOpenID4VCIHelper } from '../OpenID4VCIHelper';
import { useCallback, useMemo, useRef } from 'react';
import { useSessionContext } from '@/context/SessionContext';
import { OpenidCredentialIssuerMetadata } from 'wallet-common';
import { OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE } from '@/config';
import type { CredentialKeyPair } from '@/services/keystore';

/**
 * Compression options for jose v4 using native Browser/Node CompressionStream API.
 * This satisfies the 'deflateRaw' and 'inflateRaw' requirements for zip: "DEF".
 */
export const compressionOptions = {
	deflateRaw: async (data: Uint8Array): Promise<Uint8Array> => {
		const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'));
		return new Uint8Array(await new Response(stream).arrayBuffer());
	},
	inflateRaw: async (data: Uint8Array): Promise<Uint8Array> => {
		const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
		return new Uint8Array(await new Response(stream).arrayBuffer());
	},
};

async function generateKeyAttestationJwtProof(
	firstKey: CredentialKeyPair,
	keyAttestation: string,
	audience: string,
	nonce: string | null,
): Promise<string> {
	const attestedKeys = decodeJwt(keyAttestation).attested_keys;
	if (!Array.isArray(attestedKeys) || !attestedKeys[0] || typeof attestedKeys[0] !== 'object') {
		throw new Error('Key attestation does not contain attested_keys[0]');
	}
	const [attestedKeyThumbprint, generatedKeyThumbprint] = await Promise.all([
		calculateJwkThumbprint(attestedKeys[0] as JWK),
		calculateJwkThumbprint(firstKey.publicKey),
	]);
	if (attestedKeyThumbprint !== generatedKeyThumbprint) {
		throw new Error('Key attestation attested_keys[0] does not match the first generated credential key');
	}

	const signingKey = await importJWK(firstKey.privateKey, firstKey.alg);
	const proofJwk: JWK = { ...firstKey.publicKey, key_ops: ['verify'] };
	return new SignJWT({
		aud: audience,
		...(nonce ? { nonce } : {}),
	})
		.setIssuedAt()
		.setProtectedHeader({
			typ: 'openid4vci-proof+jwt',
			alg: firstKey.alg,
			key_attestation: keyAttestation,
			jwk: proofJwk,
		})
		.sign(signingKey);
}

export function useCredentialRequest() {
	const httpProxy = useHttpProxy();
	const openID4VCIHelper = useOpenID4VCIHelper();
	const { keystore, api } = useSessionContext();

	const credentialEndpointURLRef = useRef<string | null>(null);
	const deferredCredentialEndpointURLRef = useRef<string | null>(null);
	const accessTokenRef = useRef<string | null>(null);
	const cNonceRef = useRef<string | null>(null);
	const dpopNonceRef = useRef<string | null>(null);
	const dpopPrivateKeyRef = useRef<KeyLike | null>(null);
	const dpopPublicKeyJwkRef = useRef<JWK | null>(null);
	const jtiRef = useRef<string | null>(null);
	const credentialIssuerIdentifierRef = useRef<string | null>(null);
	const credentialConfigurationIdRef = useRef<string | null>(null);

	const credentialIssuerMetadataRef = useRef<{ metadata: OpenidCredentialIssuerMetadata } | null>(null);

	const { post, updatePrivateData } = api;

	const requestKeyAttestation = useCallback(
		async (jwks: JWK[], nonce: string | null) => {
			try {
				const response = await post('/wallet-provider/key-attestation/generate', {
					jwks,
					openid4vci: {
						nonce: nonce,
					},
				});
				const { key_attestation } = response.data;
				if (!key_attestation || typeof key_attestation != 'string') {
					console.log('Cannot parse key_attestation from wallet-backend-server');
					return null;
				}
				return { key_attestation };
			} catch (err) {
				console.log(err);
				return null;
			}
		},
		[post],
	);

	const httpHeaders = useMemo<Record<string, string>>(
		() => ({
			'Content-Type': 'application/json',
		}),
		[],
	);

	const setCredentialEndpoint = useCallback((endpoint: string | null) => {
		deferredCredentialEndpointURLRef.current = null;
		credentialEndpointURLRef.current = endpoint;
	}, []);

	const setDeferredCredentialEndpoint = useCallback((endpoint: string | null) => {
		credentialEndpointURLRef.current = null;
		deferredCredentialEndpointURLRef.current = endpoint;
	}, []);

	const setCNonce = useCallback((cNonce: string) => {
		cNonceRef.current = cNonce;
	}, []);

	const setAccessToken = useCallback(
		(at: string) => {
			accessTokenRef.current = at;
			httpHeaders['Authorization'] = `Bearer ${at}`;
		},
		[httpHeaders],
	);

	const setDpopNonce = useCallback((dpopNonce: string) => {
		dpopNonceRef.current = dpopNonce;
	}, []);

	const setDpopPrivateKey = useCallback((sk: KeyLike) => {
		dpopPrivateKeyRef.current = sk;
	}, []);

	const setDpopPublicKeyJwk = useCallback((jwk: JWK) => {
		dpopPublicKeyJwkRef.current = jwk;
	}, []);

	const setDpopJti = useCallback((id: string) => {
		jtiRef.current = id;
	}, []);

	const setCredentialConfigurationId = useCallback((id: string) => {
		credentialConfigurationIdRef.current = id;
	}, []);

	const setDpopHeader = useCallback(async () => {
		const credentialEndpointURL = credentialEndpointURLRef.current ?? deferredCredentialEndpointURLRef.current;
		const dpopPublicKeyJwk = dpopPublicKeyJwkRef.current;
		if (!dpopPublicKeyJwk) {
			return;
		}
		const jti = jtiRef.current;
		const dpopNonce = dpopNonceRef.current;
		const accessToken = accessTokenRef.current;
		const dpopPrivateKey = dpopPrivateKeyRef.current;

		if (!credentialEndpointURL || !dpopPrivateKey || !dpopPublicKeyJwk || !jti) {
			throw new Error('Missing required parameters for DPoP header');
		}

		if (!dpopPublicKeyJwk) {
			throw new Error('CredentialRequest: dpopPublicKeyJwk was not defined');
		}

		const credentialEndpointDPoP = await generateDPoP(
			dpopPrivateKey,
			dpopPublicKeyJwk,
			'POST',
			credentialEndpointURL,
			dpopNonce ?? undefined,
			accessToken ?? undefined,
		);

		httpHeaders['Authorization'] = `DPoP ${accessToken}`;
		httpHeaders['dpop'] = credentialEndpointDPoP;
	}, [httpHeaders]);

	const setCredentialIssuerIdentifier = useCallback((id: string) => {
		credentialIssuerIdentifierRef.current = id;
	}, []);

	const executeDeferredFetch = useCallback(
		async (transactionId: string): Promise<{ credentialResponse: any }> => {
			try {
				const deferredCredentialEndpointURL = deferredCredentialEndpointURLRef.current;
				if (!deferredCredentialEndpointURL) {
					throw new Error('Deferred credential endpoint is not set');
				}
				const credentialResponse = await httpProxy.post(
					deferredCredentialEndpointURL,
					{ transaction_id: transactionId },
					httpHeaders,
				);
				return { credentialResponse };
			} catch (err) {
				console.error(err);
				throw new Error('Deferred Credential Request failed');
			}
		},
		[httpProxy, httpHeaders],
	);

	const execute = useCallback(
		async (
			credentialConfigurationId: string,
			proofType: 'jwt' | 'attestation',
			keyAttestationRequired: boolean,
			cachedProofs?: { jwt?: string[]; attestation?: string[] },
		): Promise<{ credentialResponse: any }> => {
			console.log('Executing credential request...');
			const credentialIssuerIdentifier = credentialIssuerIdentifierRef.current;
			const c_nonce = cNonceRef.current;
			const credentialEndpointURL = credentialEndpointURLRef.current;
			if (!credentialIssuerIdentifier || !credentialEndpointURL) {
				throw new Error('Missing required parameters for credential request');
			}

			const [credentialIssuerMetadata, clientId] = await Promise.all([
				openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
				proofType === 'jwt' && !keyAttestationRequired
					? openID4VCIHelper.getClientId(credentialIssuerIdentifier)
					: Promise.resolve(null),
			]);
			if (!credentialIssuerMetadata) {
				throw new Error('Missing issuer metadata');
			}

			const credentialEndpointBody = {} as any;
			const numberOfProofs =
				credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size &&
				credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size > OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE
					? OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE
					: (credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size ?? 1);
			let proofsToSend: { jwt?: string[]; attestation?: string[] };

			try {
				if (cachedProofs) {
					proofsToSend = cachedProofs;
				} else if (keyAttestationRequired) {
					const [{ keypairs }, newPrivateData, keystoreCommit] = await keystore.generateKeypairs(numberOfProofs);
					if (keypairs.length === 0) {
						throw new Error('No credential keypairs were generated');
					}
					await updatePrivateData(newPrivateData);
					await keystoreCommit();
					const publicKeys = keypairs.map(({ publicKey }) => ({ ...publicKey, key_ops: ['verify'] }));

					const requestKeyAttestationResponse = await requestKeyAttestation(publicKeys, c_nonce);
					if (!requestKeyAttestationResponse) {
						throw new Error('Failed to get key attestation from wallet provider.');
					}
					const keyAttestation = requestKeyAttestationResponse.key_attestation;

					if (proofType === 'attestation') {
						proofsToSend = { attestation: [keyAttestation] };
					} else {
						const keyAttestationProof = await generateKeyAttestationJwtProof(
							keypairs[0],
							keyAttestation,
							credentialIssuerMetadata.metadata.credential_issuer,
							c_nonce,
						);
						proofsToSend = { jwt: [keyAttestationProof] };
					}
				} else {
					if (!clientId) {
						throw new Error('Missing client id for JWT proof');
					}
					const inputs = Array.from({ length: numberOfProofs }, () => ({
						nonce: c_nonce ?? undefined,
						issuer: clientId.client_id,
						audience: credentialIssuerMetadata.metadata.credential_issuer,
					}));
					const [{ proof_jwts }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs(inputs);
					await updatePrivateData(newPrivateData);
					await keystoreCommit();
					proofsToSend = { jwt: proof_jwts };
				}
				credentialEndpointBody.proofs = proofsToSend;
			} catch (err) {
				console.error(err);
				throw new Error('Failed to generate proof');
			}

			credentialIssuerMetadataRef.current = credentialIssuerMetadata;

			credentialEndpointBody.credential_configuration_id = credentialConfigurationId;

			console.log('Credential endpoint body = ', credentialEndpointBody);

			let credentialRequestEncryptionRequested = false;
			let credentialRequestEncryptionAlg: string | undefined;
			let credentialRequestEncryptionEnc: string | undefined;
			let credentialRequestEncryptionZip: string | undefined;

			const credentialRequestEncryptionMetadata = credentialIssuerMetadata.metadata.credential_request_encryption;
			if (credentialRequestEncryptionMetadata) {
				credentialRequestEncryptionRequested = true;

				const credentialRequestEncryptionRequired = credentialRequestEncryptionMetadata.encryption_required;

				const credentialRequestEncryptionSupportedErrors = [];

				const credentialRequestWalletSupportedAlg = ['ECDH-ES'];
				const credentialRequestIssuerSupportedAlg = credentialRequestEncryptionMetadata.jwks.keys.map((k) => k.alg);
				credentialRequestEncryptionAlg = credentialRequestWalletSupportedAlg.find((alg) =>
					credentialRequestIssuerSupportedAlg.includes(alg),
				);
				if (!credentialRequestEncryptionAlg) {
					credentialRequestEncryptionSupportedErrors.push(
						`No supported credential_request_encryption keys found. Keys using Alg values[${credentialRequestWalletSupportedAlg.join(', ')}] are supported.`,
					);
				}

				const credentialRequestWalletSupportedEnc = ['A128GCM', 'A256GCM'];
				const credentialRequestIssuerSupportedEnc = credentialRequestEncryptionMetadata.enc_values_supported;
				credentialRequestEncryptionEnc = credentialRequestWalletSupportedEnc.find((enc) =>
					credentialRequestIssuerSupportedEnc.includes(enc),
				);
				if (!credentialRequestEncryptionEnc) {
					credentialRequestEncryptionSupportedErrors.push(
						`Unsupported credential_request_encryption.enc_values_supported. [${credentialRequestWalletSupportedEnc.join(', ')}] are supported.`,
					);
				}

				if (credentialRequestEncryptionMetadata.zip_values_supported) {
					const credentialRequestWalletSupportedZip = ['DEF'];
					const credentialRequestIssuerSupportedZip = credentialRequestEncryptionMetadata.zip_values_supported;
					credentialRequestEncryptionZip = credentialRequestWalletSupportedZip.find((zip) =>
						credentialRequestIssuerSupportedZip.includes(zip),
					);
					if (!credentialRequestEncryptionZip) {
						credentialRequestEncryptionSupportedErrors.push(
							`Unsupported credential_request_encryption.zip_values_supported. [${credentialRequestWalletSupportedZip.join(', ')}] are supported.`,
						);
					}
				}

				if (credentialRequestEncryptionSupportedErrors.length > 0) {
					if (credentialRequestEncryptionRequired) {
						throw new Error(
							'Credential request encryption requirements not met: ' +
								credentialRequestEncryptionSupportedErrors.join('; '),
						);
					} else {
						credentialRequestEncryptionRequested = false;
					}
				}
			}

			let credentialResponseEncryptionRequested = false;
			let credentialResponseEncryptionAlg: string | undefined;
			let credentialResponseEncryptionEnc: string | undefined;
			let credentialResponseEncryptionZip: string | undefined;
			let ephemeralKeypair: CryptoKeyPair | undefined;

			if (credentialIssuerMetadata.metadata.credential_response_encryption) {
				credentialResponseEncryptionRequested = true;

				const credentialResponseEncryptionRequired =
					credentialIssuerMetadata.metadata.credential_response_encryption.encryption_required;

				const credentialResponseEncryptionSupportedErrors = [];

				const credentialResponseWalletSupportedAlg = ['ECDH-ES'];
				const credentialResponseIssuerSupportedAlg =
					credentialIssuerMetadata.metadata.credential_response_encryption.alg_values_supported;
				credentialResponseEncryptionAlg = credentialResponseWalletSupportedAlg.find((alg) =>
					credentialResponseIssuerSupportedAlg.includes(alg),
				);
				if (!credentialResponseEncryptionAlg) {
					credentialResponseEncryptionSupportedErrors.push(
						`Unsupported credential_response_encryption.alg_values_supported. [${credentialResponseWalletSupportedAlg.join(', ')}] are supported`,
					);
				}

				const credentialResponseWalletSupportedEnc = ['A128CBC-HS256', 'A128GCM', 'A256GCM'];
				const credentialResponseIssuerSupportedEnc =
					credentialIssuerMetadata.metadata.credential_response_encryption.enc_values_supported;
				credentialResponseEncryptionEnc = credentialResponseWalletSupportedEnc.find((enc) =>
					credentialResponseIssuerSupportedEnc.includes(enc),
				);
				if (!credentialResponseEncryptionEnc) {
					credentialResponseEncryptionSupportedErrors.push(
						`Unsupported credential_response_encryption.enc_values_supported. [${credentialResponseWalletSupportedEnc.join(', ')}] are supported`,
					);
				}

				if (credentialIssuerMetadata.metadata.credential_response_encryption.zip_values_supported) {
					const credentialResponseWalletSupportedZip = ['DEF'];
					const credentialResponseIssuerSupportedZip =
						credentialIssuerMetadata.metadata.credential_response_encryption.zip_values_supported;
					credentialResponseEncryptionZip = credentialResponseWalletSupportedZip.find((zip) =>
						credentialResponseIssuerSupportedZip.includes(zip),
					);
					if (!credentialResponseEncryptionZip) {
						credentialResponseEncryptionSupportedErrors.push(
							`Unsupported credential_response_encryption.zip_values_supported. [${credentialResponseWalletSupportedZip.join(', ')}] are supported.`,
						);
					}
				}

				if (credentialResponseEncryptionSupportedErrors.length > 0) {
					if (credentialResponseEncryptionRequired) {
						throw new Error(
							'Credential response encryption requirements not met: ' +
								credentialResponseEncryptionSupportedErrors.join('; '),
						);
					} else {
						credentialResponseEncryptionRequested = false;
					}
				}
			}

			if (credentialResponseEncryptionRequested) {
				if (!credentialResponseEncryptionAlg || !credentialResponseEncryptionEnc) {
					throw new Error('Credential response encryption parameters are not set');
				}

				ephemeralKeypair = await generateKeyPair(credentialResponseEncryptionAlg);

				const ephemeralPublicKeyJwk = await exportJWK(ephemeralKeypair.publicKey);
				credentialEndpointBody.credential_response_encryption = {
					alg: credentialResponseEncryptionAlg,
					enc: credentialResponseEncryptionEnc,
					jwk: {
						...ephemeralPublicKeyJwk,
						alg: credentialResponseEncryptionAlg,
						use: 'enc',
					},
				};
			}

			let credentialRequestContentType: string;
			let credentialRequestBody: string | object;
			if (credentialRequestEncryptionRequested) {
				if (
					!credentialRequestEncryptionMetadata ||
					!credentialRequestEncryptionAlg ||
					!credentialRequestEncryptionEnc
				) {
					throw new Error('Credential request encryption parameters are not set');
				}
				const jwk = credentialRequestEncryptionMetadata.jwks.keys.find((k) => k.alg === credentialRequestEncryptionAlg);
				if (!jwk) {
					throw new Error('Credential request encryption key is not set');
				}
				const clientPublicKey = await importJWK(jwk, credentialRequestEncryptionAlg);

				const encryptor = new CompactEncrypt(new TextEncoder().encode(JSON.stringify(credentialEndpointBody)));

				const protectedHeader: CompactJWEHeaderParameters = {
					alg: credentialRequestEncryptionAlg,
					enc: credentialRequestEncryptionEnc,
				};
				if (credentialRequestEncryptionZip) {
					protectedHeader.zip = credentialRequestEncryptionZip;
				}

				const jwe = await encryptor.setProtectedHeader(protectedHeader).encrypt(clientPublicKey, compressionOptions);

				credentialRequestContentType = 'application/jwt';
				credentialRequestBody = jwe;
			} else {
				credentialRequestContentType = 'application/json';
				credentialRequestBody = credentialEndpointBody;
			}

			httpHeaders['Content-Type'] = credentialRequestContentType;
			console.log(
				`Sending ${credentialRequestEncryptionRequested ? 'encrypted (JWT)' : 'unencrypted (JSON)'} credential request to `,
				credentialEndpointURL,
				credentialRequestBody,
				httpHeaders,
			);
			const credentialResponse = await httpProxy.post(credentialEndpointURL, credentialRequestBody, httpHeaders);

			const credentialResponseContentType =
				credentialResponse.headers['Content-Type'] ?? credentialResponse.headers['content-type'];
			if (
				credentialResponseEncryptionRequested &&
				typeof credentialResponseContentType === 'string' &&
				credentialResponseContentType.startsWith('application/jwt')
			) {
				if (!ephemeralKeypair) {
					throw new Error('Credential response encryption keypair is not set');
				}
				const result = await compactDecrypt(
					credentialResponse.data as string,
					ephemeralKeypair.privateKey,
					compressionOptions,
				)
					.then((data): { data: CompactDecryptResult | null; err: unknown } => ({ data, err: null }))
					.catch((err: unknown): { data: CompactDecryptResult | null; err: unknown } => ({ data: null, err }));
				if (result.err) {
					throw new Error('Credential Response decryption failed');
				}
				const { plaintext } = result.data as CompactDecryptResult;
				const payload = JSON.parse(new TextDecoder().decode(plaintext));
				credentialResponse.data = payload;
			}
			if (credentialResponse.status >= 400) {
				console.error('Error: Credential response = ', JSON.stringify(credentialResponse));
				if (
					credentialResponse.headers?.['www-authenticate'] &&
					((credentialResponse.headers?.['www-authenticate'] as string).includes('invalid_dpop_proof') ||
						(credentialResponse.headers?.['www-authenticate'] as string).includes('use_dpop_nonce')) &&
					'dpop-nonce' in credentialResponse.headers
				) {
					console.log('Calling credentialRequest with new dpop-nonce....');

					setDpopNonce(credentialResponse.headers?.['dpop-nonce'] as string);
					await setDpopHeader();
					// response.headers['dpop-nonce'] = credentialResponse.err.headers["dpop-nonce"];
					return await execute(credentialConfigurationId, proofType, keyAttestationRequired, proofsToSend);
				}
				throw new Error('Credential Request failed');
			}

			// const credentialResponseData = credentialResponse.data as { credentials: { credential: string }[] };

			// receivedCredentialsArrayRef.current = credentialArray;
			console.log('Credential response: ', credentialResponse);
			return { credentialResponse };
		},
		[
			updatePrivateData,
			httpProxy,
			keystore,
			openID4VCIHelper,
			setDpopHeader,
			setDpopNonce,
			httpHeaders,
			requestKeyAttestation,
		],
	);

	return useMemo(
		() => ({
			setCredentialEndpoint,
			setDeferredCredentialEndpoint,
			setCNonce,
			setAccessToken,
			setDpopNonce,
			setDpopPrivateKey,
			setDpopPublicKeyJwk,
			setDpopJti,
			setCredentialConfigurationId,
			setDpopHeader,
			setCredentialIssuerIdentifier,
			executeDeferredFetch,
			execute,
		}),
		[
			setCredentialEndpoint,
			setDeferredCredentialEndpoint,
			setCNonce,
			setAccessToken,
			setDpopNonce,
			setDpopPrivateKey,
			setDpopPublicKeyJwk,
			setDpopJti,
			setCredentialConfigurationId,
			setDpopHeader,
			setCredentialIssuerIdentifier,
			executeDeferredFetch,
			execute,
		],
	);
}
