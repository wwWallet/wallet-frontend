import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";
import { useHttpProxy } from "./HttpProxy/HttpProxy";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
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


	const getClientId = useCallback(
		async (credentialIssuerIdentifier: string) => {
			console.log('getClientId');

			try {
				const issuerResponse = await getExternalEntity('/issuer/all', undefined, true);
				const trustedCredentialIssuers = issuerResponse.data;
				const issuer = trustedCredentialIssuers.filter((issuer: any) => issuer.credentialIssuerIdentifier === credentialIssuerIdentifier)[0];
				if (issuer) {
					return { client_id: issuer.clientId };
				}

				return { client_id: "CLIENT123" };
			}
			catch (err) {
				console.log("Could not get client_id for issuer " + credentialIssuerIdentifier + " Details:");
				console.error(err);
				return { client_id: "CLIENT123" };
			}
		},
		[getExternalEntity]
	);

	// Fetches authorization server metadata with fallback
	const getAuthorizationServerMetadata = useCallback(
		async (credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null> => {
			const pathAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
			const pathConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;
			console.log('getAuthorizationServerMetadata');
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
					return null;
				}
				return { authzServeMetadata };
			}
		},
		[fetchAndParseWithSchema]
	);

	const getCredentialIssuerMetadata = useCallback(
		async (credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> => {
			const pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;
			console.log('getCredentialIssuerMetadata', useCache);
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


	const getMdocIacas = useCallback(
		async (credentialIssuerIdentifier: string, metadata?: OpenidCredentialIssuerMetadata, useCache?: boolean) => {
			console.log('getMdocIacas');
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
		[]
	);

	const fetchIssuerMetadataAndCertificates = useCallback(
		async (
			getIssuers: () => Promise<Record<string, unknown>[]>,
			onCertificates: (pemCertificates: string[]) => void,
			shouldUseCache: boolean
		): Promise<void> => {
			console.log('fetchIssuerMetadataAndCertificates - shouldUseCache', shouldUseCache);


			const credentialIssuerEntities = await getIssuers().catch(() => []);
			const result = await Promise.all(credentialIssuerEntities.map(async (issuerEntity) =>
				"credentialIssuerIdentifier" in issuerEntity && typeof issuerEntity.credentialIssuerIdentifier === "string" ?
					getCredentialIssuerMetadata(issuerEntity.credentialIssuerIdentifier, shouldUseCache).then((result =>
						result?.metadata
					)).catch((err) => { console.error(err); return null; }) : null
			));

			for (const r of result) {
				if (!r) continue;

				const logoUris: string[] = [];

				// Issuer display array
				if (Array.isArray(r.display)) {
					for (const entry of r.display) {
						if (entry?.logo?.uri) {
							logoUris.push(entry.logo.uri);
						}
					}
				}

				// credential_configurations_supported.*.display[]
				if (r.credential_configurations_supported && typeof r.credential_configurations_supported === 'object') {
					for (const config of Object.values(r.credential_configurations_supported)) {
						const configObj = config as Record<string, any>;
						if (Array.isArray(configObj.display)) {
							for (const entry of configObj.display) {
								if (entry?.logo?.uri) {
									logoUris.push(entry.logo.uri);
								}
							}
						}
					}
				}

				// Fetch logos
				for (const uri of logoUris) {
					try {
						await httpProxy.get(uri, {}, { useCache: shouldUseCache });
					} catch (err) {
						console.error(`Failed to fetch logo from ${uri}`, err);
					}
				}

				if (r.mdoc_iacas_uri) {
					try {
						const response = await getMdocIacas(r.credential_issuer, r, shouldUseCache);
						if (!response.iacas) {
							continue;
						}
						const pemCertificates = response.iacas.map((cert) =>
							`-----BEGIN CERTIFICATE-----\n${cert.certificate}\n-----END CERTIFICATE-----\n`
						)
						onCertificates(pemCertificates);
					}
					catch (err) {
						continue;
					}
				}
			}
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
