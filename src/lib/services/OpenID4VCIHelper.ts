import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";
import { useHttpProxy } from "./HttpProxy/HttpProxy";
import { useCallback, useContext, useMemo } from "react";
import SessionContext from "@/context/SessionContext";
import { MdocIacasResponse, MdocIacasResponseSchema } from "../schemas/MdocIacasResponseSchema";
import { OpenidAuthorizationServerMetadataSchema, OpenidCredentialIssuerMetadataSchema } from 'wallet-common';
import type { OpenidAuthorizationServerMetadata, OpenidCredentialIssuerMetadata } from 'wallet-common'

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
			const pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;
			try {
				const metadata = await fetchAndParseWithSchema<OpenidCredentialIssuerMetadata>(
					pathCredentialIssuer,
					OpenidCredentialIssuerMetadataSchema,
					useCache,
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
	const getAuthorizationServerMetadata = useCallback(
		async (credentialIssuerIdentifier: string): Promise<{ authzServerMetadata: OpenidAuthorizationServerMetadata } | null> => {
			const pathAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
			const { metadata } = await getCredentialIssuerMetadata(credentialIssuerIdentifier);
			const pathAuthorizationServerFromCredentialIssuerMetadata = metadata.authorization_servers && metadata.authorization_servers.length > 0 ?
				`${metadata.authorization_servers[0]}/.well-known/oauth-authorization-server` :
				null;

			const pathConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;
			try {
				const authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathAuthorizationServer,
					OpenidAuthorizationServerMetadataSchema,
				);
				return { authzServerMetadata };
			} catch {
				// Fallback to openid-configuration if oauth-authorization-server fetch fails
				const authzServerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
					pathConfiguration,
					OpenidAuthorizationServerMetadataSchema,
				).catch(() => null);

				if (!authzServerMetadata) {
					const authzMetadataFromCredentialIssuerMetadata = await fetchAndParseWithSchema<OpenidAuthorizationServerMetadata>(
						pathAuthorizationServerFromCredentialIssuerMetadata,
						OpenidAuthorizationServerMetadataSchema,
					).catch(() => null);
					if (!authzMetadataFromCredentialIssuerMetadata) {
						return null;
					}
					return { authzServerMetadata: authzMetadataFromCredentialIssuerMetadata };
				}
				return { authzServerMetadata };
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
			const certificates = [];
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
		[getCredentialIssuerMetadata, getMdocIacas, httpProxy, getExternalEntity]
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
