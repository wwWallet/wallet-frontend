import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";
import { useHttpProxy } from "./HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import { MdocIacasResponse, MdocIacasResponseSchema } from "../schemas/MdocIacasResponseSchema";
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

	const getCredentialIssuerMetadata = useCallback(
		async (credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> => {
			const pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;
			try {
				const metadata = await fetchAndParseWithSchema<OpenidCredentialIssuerMetadata>(
					pathCredentialIssuer,
					OpenidCredentialIssuerMetadataSchema,
					useCache,
					useCache === false,
				);
				if (metadata.signed_metadata) {
					try {
						const parsedHeader = JSON.parse(new TextDecoder().decode(base64url.decode(metadata.signed_metadata.split('.')[0])));
						if (parsedHeader.x5c) {
							const publicKey = await importX509(getPublicKeyFromB64Cert(parsedHeader.x5c[0]), parsedHeader.alg);
							const { payload } = await jwtVerify(metadata.signed_metadata, publicKey);
							return { metadata: payload as OpenidCredentialIssuerMetadata };
						}
						return null;
					}
					catch (err) {
						console.error(err);
						return null;
					}
				}
				return { metadata };
			}
			catch (err) {
				console.error(err);
				return null;
			}
		},
		[fetchAndParseWithSchema]
	);

	// Fetches authorization server metadata with fallback
	// According to OpenID4VCI 1.0, section 12.2.4, paragraph 2.2, the authorization server is to be fetched from the credential issuer metadata.
	// If not available from metadata, then the issuer is imlplied to also act as the authorization server.
	const getAuthorizationServerMetadata = useCallback(
		async (credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ authzServerMetadata: OpenidAuthorizationServerMetadata } | null> => {
			const authorizationServerWellKnownLocation = ".well-known/oauth-authorization-server";
			const { metadata } = await getCredentialIssuerMetadata(credentialIssuerIdentifier);
			const pathAuthorizationServerFromCredentialIssuerMetadata = metadata.authorization_servers && metadata.authorization_servers.length > 0 ?
				`${metadata.authorization_servers[0]}/${authorizationServerWellKnownLocation}` :
				null;
			const pathIssuerAuthorizationServer = `${credentialIssuerIdentifier}/${authorizationServerWellKnownLocation}`;
			const pathIssuerOpenIdConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;
			let authzServerMetadata: OpenidAuthorizationServerMetadata = null;

			if (pathAuthorizationServerFromCredentialIssuerMetadata) {
				// 1st attempt: authorization server from credential issuer metadata
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathAuthorizationServerFromCredentialIssuerMetadata,
					OpenidAuthorizationServerMetadataSchema,
					useCache,
				).catch(() => null);
			}

			if (!authzServerMetadata) {
				// 2nd attempt: if authorization-server not provided in metadata, the issuer iteslf is acting as an authorization-server
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathIssuerAuthorizationServer,
					OpenidAuthorizationServerMetadataSchema,
					useCache,
					useCache === false
				).catch(() => null);
			}

			if (!authzServerMetadata) {
				// 3rd attempt: Fallback to openid-configuration if oauth-authorization-server fetch fails
				authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathIssuerOpenIdConfiguration,
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
