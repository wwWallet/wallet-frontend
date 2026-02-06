import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";
import { useHttpProxy } from "./HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import { MdocIacasResponse, MdocIacasResponseSchema } from "../schemas/MdocIacasResponseSchema";
import { OpenidAuthorizationServerMetadataSchema, OpenidCredentialIssuerMetadataSchema } from 'wallet-common';
import type { OpenidAuthorizationServerMetadata, OpenidCredentialIssuerMetadata } from 'wallet-common'
import { isDiscoverAndTrustAvailable, discoverAndTrustIssuer } from './DiscoverAndTrustService';

/**
 * Verifies and extracts metadata from signed_metadata JWT if present.
 * Returns the verified payload as metadata, or null if verification fails.
 */
async function verifySignedMetadata(
	metadata: OpenidCredentialIssuerMetadata
): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> {
	if (!metadata.signed_metadata) {
		return { metadata };
	}

	try {
		const headerB64 = metadata.signed_metadata.split('.')[0];
		const parsedHeader = JSON.parse(new TextDecoder().decode(base64url.decode(headerB64)));

		if (!parsedHeader.x5c) {
			return null;
		}

		const publicKey = await importX509(getPublicKeyFromB64Cert(parsedHeader.x5c[0]), parsedHeader.alg);
		const { payload } = await jwtVerify(metadata.signed_metadata, publicKey);
		return { metadata: payload as OpenidCredentialIssuerMetadata };
	} catch (err) {
		console.error('Failed to verify signed_metadata:', err);
		return null;
	}
}

/**
 * Attempts to fetch issuer metadata via the discover-and-trust API.
 * Returns null if the API is unavailable or if discovery fails.
 */
async function tryDiscoverAndTrust(
	credentialIssuerIdentifier: string,
	appToken: string | null
): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null | 'fallback'> {
	if (!isDiscoverAndTrustAvailable() || !appToken) {
		return 'fallback';
	}

	try {
		const result = await discoverAndTrustIssuer(credentialIssuerIdentifier, appToken);

		if (result.discovery_status !== 'success' || !result.issuer_metadata) {
			console.warn('discover-and-trust returned non-success status:', result.discovery_status);
			return 'fallback';
		}

		return verifySignedMetadata(result.issuer_metadata as OpenidCredentialIssuerMetadata);
	} catch (err) {
		console.warn('discover-and-trust failed, falling back to proxy:', err);
		return 'fallback';
	}
}

export function useOpenID4VCIHelper(): IOpenID4VCIHelper {
	const httpProxy = useHttpProxy();
	const { api } = useContext(SessionContext);
	const { getExternalEntity } = api;

	const fetchAndParseWithSchema = useCallback(
		async function fetchAndParseWithSchema<T>(path: string, schema: any, useCache: boolean = true): Promise<T> {
			try {
				const response = await httpProxy.get(path, {}, { useCache: useCache !== undefined ? useCache : true });
				if (!response) throw new Error("Couldn't get response");

				const parsedData = schema.parse(response.data);
				return parsedData;
			} catch (err) {
				console.error(`Error fetching from ${path}:`, err);
				throw new Error(`Couldn't get data from ${path}`);
			}
		}, [httpProxy])

	const getCredentialIssuerMetadata = useCallback(
		async (credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> => {
			// Try the new discover-and-trust API first if available
			const discoverResult = await tryDiscoverAndTrust(credentialIssuerIdentifier, api.getAppToken());
			if (discoverResult !== 'fallback') {
				return discoverResult;
			}

			// Legacy approach using HTTP proxy
			const pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;
			try {
				const metadata = await fetchAndParseWithSchema<OpenidCredentialIssuerMetadata>(
					pathCredentialIssuer,
					OpenidCredentialIssuerMetadataSchema,
					useCache,
				);
				return verifySignedMetadata(metadata);
			}
			catch (err) {
				console.error(err);
				return null;
			}
		},
		[api, fetchAndParseWithSchema]
	);

	// Fetches authorization server metadata with fallback
	const getAuthorizationServerMetadata = useCallback(
		async (credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null> => {
			const pathAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
			const { metadata } = await getCredentialIssuerMetadata(credentialIssuerIdentifier);
			const pathAuthorizationServerFromCredentialIssuerMetadata = metadata.authorization_servers && metadata.authorization_servers.length > 0 ?
				`${metadata.authorization_servers[0]}/.well-known/oauth-authorization-server` :
				null;

			const pathConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;
			try {
				const authzServeMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathAuthorizationServer,
					OpenidAuthorizationServerMetadataSchema,
				);
				return { authzServeMetadata };
			} catch {
				// Fallback to openid-configuration if oauth-authorization-server fetch fails
				const authzServeMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathConfiguration,
					OpenidAuthorizationServerMetadataSchema,
				).catch(() => null);

				if (!authzServeMetadata) {
					const authzMetadataFromCredentialIssuerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
						pathAuthorizationServerFromCredentialIssuerMetadata,
						OpenidAuthorizationServerMetadataSchema,
					).catch(() => null);
					if (!authzMetadataFromCredentialIssuerMetadata) {
						return null;
					}
					return { authzServeMetadata: authzMetadataFromCredentialIssuerMetadata };
				}
				return { authzServeMetadata };
			}
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

				return null;
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

			issuerEntities.forEach(async (entity: any) => {
				if (!entity.credentialIssuerIdentifier) return;

				try {
					const metadataResult = await getCredentialIssuerMetadata(entity.credentialIssuerIdentifier, shouldUseCache);
					const metadata = metadataResult?.metadata;
					if (!metadata) return;

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
							onCertificates(response.iacas.map(cert =>
								`-----BEGIN CERTIFICATE-----\n${cert.certificate}\n-----END CERTIFICATE-----\n`
							));
						}
					}
				} catch (error) {
					console.error(`Failed to fetch metadata for ${entity.credentialIssuerIdentifier}:`, error);
				}
			});
		},
		[getCredentialIssuerMetadata, getMdocIacas, httpProxy]
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
