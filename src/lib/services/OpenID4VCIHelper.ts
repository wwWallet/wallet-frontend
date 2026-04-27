import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";
import { useHttpProxy } from "./HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import { MdocIacasResponse, MdocIacasResponseSchema, prependToPath } from "wallet-common"
import { OpenidAuthorizationServerMetadataSchema, OpenidCredentialIssuerMetadataSchema } from 'wallet-common';
import type { OpenidAuthorizationServerMetadata, OpenidCredentialIssuerMetadata } from 'wallet-common'
import { OPENID4VCI_REDIRECT_URI } from "@/config";

export function useOpenID4VCIHelper(): IOpenID4VCIHelper {
	const httpProxy = useHttpProxy();
	const { api } = useContext(SessionContext);
	const { getExternalEntity } = api;

	const fetchAndParseWithSchema = useCallback(
		async function fetchAndParseWithSchema<T>(path: string, schema: any, useCache: boolean = true, cacheOnError: boolean = false): Promise<T> {
			try {
				const response = await httpProxy.get(path, {}, { useCache: useCache !== undefined ? useCache : true, cacheOnError });
				if (!response) throw new Error("Couldn't get response");

				const result = schema.safeParse(response.data);

				if (!result.success) {
					console.warn(`Schema validation failed for ${path}:`, result.error.issues);
					throw new Error("Invalid response schema");
				}

				return result.data;
			} catch (err) {
				console.error(`Error fetching from ${path}:`, err);
				throw new Error(`Couldn't get data from ${path}`);
			}
		}, [httpProxy])

	/**
	 * Decodes and validates the JWT header from a signed metadata string.
	 * Extracts the public key certificate for verification.
	 */
	const parseAndValidateJwtHeader = useCallback(
		async (signedMetadataJwt: string) => {
			try {
				const [headerB64] = signedMetadataJwt.split('.');
				const headerJson = new TextDecoder().decode(base64url.decode(headerB64));
				const header = JSON.parse(headerJson);

				if (!header.x5c?.length) {
					console.warn('JWT header missing x5c certificate chain');
					return null;
				}

				return header;
			} catch (err) {
				console.error('Failed to parse JWT header:', err);
				return null;
			}
		},
		[]
	);

	/**
	 * Verifies signed metadata JWT and extracts the verified payload.
	 * Returns the verified metadata or null if verification fails.
	 */
	const verifySignedMetadata = useCallback(
		async (signedMetadataJwt: string): Promise<OpenidCredentialIssuerMetadata | null> => {
			const header = await parseAndValidateJwtHeader(signedMetadataJwt);
			if (!header) {
				return null;
			}

			try {
				const publicKey = await importX509(
					getPublicKeyFromB64Cert(header.x5c[0]),
					header.alg
				);
				const { payload } = await jwtVerify(signedMetadataJwt, publicKey);
				return payload as OpenidCredentialIssuerMetadata;
			} catch (err) {
				console.error('JWT signature verification failed:', err);
				return null;
			}
		},
		[parseAndValidateJwtHeader]
	);

	/**
	 * Attempts to fetch metadata from multiple endpoint paths with fallback logic.
	 * Returns the first successful response or null if all attempts fail.
	 */
	const fetchMetadataWithFallback = useCallback(
		async (
			endpointPaths: string[],
			useCache?: boolean
		): Promise<OpenidCredentialIssuerMetadata | null> => {
			const errors: Array<{ path: string; error: Error }> = [];

			for (const path of endpointPaths) {
				try {
					return await fetchAndParseWithSchema<OpenidCredentialIssuerMetadata>(
						path,
						OpenidCredentialIssuerMetadataSchema,
						useCache,
						useCache === false
					);
				} catch (err) {
					const error = err instanceof Error ? err : new Error(String(err));
					errors.push({ path, error });
					continue;
				}
			}

			if (errors.length > 0) {
				const errorMessages = errors.map(e => `${e.path}: ${e.error.message}`).join('; ');
				console.error('All metadata endpoints failed:', errorMessages);
			}
			return null;
		},
		[fetchAndParseWithSchema]
	);

	/**
	 * Retrieves credential issuer metadata with signature verification if present.
	 * Falls back between standard and legacy endpoint paths.
	 */
	const getCredentialIssuerMetadata = useCallback(
		async (
			credentialIssuerIdentifier: string,
			useCache?: boolean
		): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> => {
			const endpointPaths = [
				prependToPath(credentialIssuerIdentifier, ".well-known/openid-credential-issuer"),
				`${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`,
				`${credentialIssuerIdentifier}/.well-known/openid-configuration`,
			];

			const metadata = await fetchMetadataWithFallback(endpointPaths, useCache);
			if (!metadata) {
				return null;
			}

			// If signed metadata is present, verify it and return the verified payload
			if (metadata.signed_metadata) {
				const verifiedMetadata = await verifySignedMetadata(metadata.signed_metadata);
				if (verifiedMetadata) {
					return { metadata: verifiedMetadata };
				}
				console.warn('Signed metadata verification failed, using unverified metadata as fallback');
			}

			return { metadata };
		},
		[fetchMetadataWithFallback, verifySignedMetadata]
	);

	// Fetches authorization server metadata with fallback
	// According to OpenID4VCI 1.0, section 12.2.4, paragraph 2.2, the authorization server is to be fetched from the credential issuer metadata.
	// If not available from metadata, then the issuer is imlplied to also act as the authorization server.
	const getAuthorizationServerMetadata = useCallback(
		async (credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ authzServerMetadata: OpenidAuthorizationServerMetadata } | null> => {
			const wellKnownOauthAuthorizationServer = ".well-known/oauth-authorization-server";
			const wellKnownOpenidConfiguration = ".well-known/openid-configuration";

			const { metadata } = await getCredentialIssuerMetadata(credentialIssuerIdentifier);
			const authorizationServerIdentifierFromCredentialIssuerMetadata = metadata.authorization_servers && metadata.authorization_servers.length > 0 ?
				metadata.authorization_servers[0] :
				null;
			let authzServerMetadata: OpenidAuthorizationServerMetadata = null;

			// Attempt to fetch authorization server metadata from the authorization server specified in the credential issuer metadata
			if (authorizationServerIdentifierFromCredentialIssuerMetadata) {
				// 1st attempt: authorization server from credential issuer metadata
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					prependToPath(authorizationServerIdentifierFromCredentialIssuerMetadata, wellKnownOauthAuthorizationServer),
					OpenidAuthorizationServerMetadataSchema,
					useCache,
				).catch(() => null);

				// 2nd attempt: Fallback to legacy oauth-authorization-server endpoint if oauth-authorization-server fetch fails
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					`${authorizationServerIdentifierFromCredentialIssuerMetadata}/${wellKnownOauthAuthorizationServer}`,
					OpenidAuthorizationServerMetadataSchema,
					useCache,
					useCache === false
				).catch(() => null);

				// 3rd attempt: Fallback to openid-configuration if both oauth-authorization-server fetches fail
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					`${authorizationServerIdentifierFromCredentialIssuerMetadata}/${wellKnownOpenidConfiguration}`,
					OpenidAuthorizationServerMetadataSchema,
					useCache,
					useCache === false
				).catch(() => null);
			}

			// Attempt to fetch authorization server metadata from issuer itself, which may be acting as an authorization-server
			if (!authzServerMetadata) {
				// 1st attempt: authorization server from oauth-authorization-server endpoint on issuer
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					prependToPath(credentialIssuerIdentifier, wellKnownOauthAuthorizationServer),
					OpenidAuthorizationServerMetadataSchema,
					useCache,
					useCache === false
				).catch(() => null);

				// 2nd attempt: Fallback to legacy oauth-authorization-server endpoint if oauth-authorization-server fetch fails
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					`${credentialIssuerIdentifier}/${wellKnownOauthAuthorizationServer}`,
					OpenidAuthorizationServerMetadataSchema,
					useCache,
					useCache === false
				).catch(() => null);

				// 3rd attempt: Fallback to openid-configuration if both oauth-authorization-server fetches fail
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					`${credentialIssuerIdentifier}/${wellKnownOpenidConfiguration}`,
					OpenidAuthorizationServerMetadataSchema,
					useCache,
					useCache === false
				).catch(() => null);
			}

			return authzServerMetadata ? { authzServerMetadata } : null;
		},
		[fetchAndParseWithSchema, getCredentialIssuerMetadata]
	);

	const getClientId = useCallback(
		async (credentialIssuerIdentifier: string) => {

			try {
				const issuerResponse = await getExternalEntity('/issuer/all', undefined, true);
				const trustedCredentialIssuers = issuerResponse.data;
				const issuer = trustedCredentialIssuers.filter((issuer: any) => issuer.credentialIssuerIdentifier === credentialIssuerIdentifier)[0];
				if (issuer) {
					return { client_id: issuer.clientId };
				}

				return { client_id: OPENID4VCI_REDIRECT_URI };
			}
			catch (err) {
				console.log("Could not get client_id for issuer " + credentialIssuerIdentifier + " Details:");
				console.error(err);
				return null;
			}
		},
		[getExternalEntity]
	);

	const getMdocIacas = useCallback(
		async (credentialIssuerIdentifier: string, metadata?: OpenidCredentialIssuerMetadata, useCache?: boolean) => {
			try {
				if (!metadata) {
					const response = await getCredentialIssuerMetadata(credentialIssuerIdentifier);
					metadata = response.metadata;
				}
				if (metadata.mdoc_iacas_uri) {
					const response = await fetchAndParseWithSchema<MdocIacasResponse>(
						`${metadata.mdoc_iacas_uri}`,
						MdocIacasResponseSchema,
						useCache
					);
					return response;
				}
				return null;
			}
			catch (err) {
				console.error(err);
				return null;
			}
		},
		[fetchAndParseWithSchema, getCredentialIssuerMetadata]
	);

	const fetchIssuerMetadataAndCertificates = useCallback(
		async (
			getIssuers: () => Promise<Record<string, unknown>[]>,
			onCertificates: (pemCertificates: string[]) => void,
			shouldUseCache: boolean,
			onIssuerMetadataResolved?: (issuerIdentifier: string, metadata: OpenidCredentialIssuerMetadata) => void
		) => {
			const issuerEntities = await getIssuers().catch(() => []);
			const certificates = [];
			issuerEntities.forEach(async (entity: any) => {
				if (!entity.credentialIssuerIdentifier) return;

				try {
					const metadataResult = await getCredentialIssuerMetadata(entity.credentialIssuerIdentifier, shouldUseCache);
					const metadata = metadataResult?.metadata;
					if (!metadata) return;

					await getAuthorizationServerMetadata(entity.credentialIssuerIdentifier, shouldUseCache);

					// Call a callback to update state when metadata resolves.
					onIssuerMetadataResolved?.(entity.credentialIssuerIdentifier, metadata);

					const logoUris = metadata.display?.map(d => d.logo?.uri).filter(Boolean) || [];
					Object.values(metadata.credential_configurations_supported || {}).forEach((config: any) => {
						config.display?.forEach(d => d.logo?.uri && logoUris.push(d.logo.uri));
					});

					logoUris.forEach(uri => httpProxy.get(uri, {}, { useCache: shouldUseCache }).catch(console.error));

					if (metadata.mdoc_iacas_uri) {
						const response = await getMdocIacas(metadata.credential_issuer, metadata, shouldUseCache);
						if (response?.iacas?.length) {
							certificates.push(response.iacas.map(cert =>
								`-----BEGIN CERTIFICATE-----\n${cert.certificate}\n-----END CERTIFICATE-----\n`
							))
						}
					}
				} catch (error) {
					console.error(`Failed to fetch metadata for ${entity.credentialIssuerIdentifier}:`, error);
				}
			});
			try {
				const iacaList = await getExternalEntity('/helper/iaca-list', undefined, shouldUseCache);
				const { iaca_list } = iacaList.data as { iaca_list: { certificate: string }[] };
				certificates.push(...iaca_list.map((c) => c.certificate));
			}
			catch {
				console.error(`Failed to get iaca list from wallet-backend-server`);
			}
			onCertificates(certificates);

		},
		[getCredentialIssuerMetadata, getMdocIacas, httpProxy, getExternalEntity, getAuthorizationServerMetadata]
	);

	return useMemo(
		() => ({
			getClientId,
			getAuthorizationServerMetadata,
			getCredentialIssuerMetadata,
			getMdocIacas,
			fetchIssuerMetadataAndCertificates,
		}),
		[
			getClientId,
			getAuthorizationServerMetadata,
			getCredentialIssuerMetadata,
			getMdocIacas,
			fetchIssuerMetadataAndCertificates,
		]
	);
}
