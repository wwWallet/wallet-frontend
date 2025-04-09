import { IOpenID4VCIHelper } from "../interfaces/IOpenID4VCIHelper";
import { OpenidAuthorizationServerMetadata, OpenidAuthorizationServerMetadataSchema } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata, OpenidCredentialIssuerMetadataSchema } from "../schemas/OpenidCredentialIssuerMetadataSchema";
import { addItem, getItem } from '../../indexedDB';
import { base64url, importX509, jwtVerify } from "jose";
import { getPublicKeyFromB64Cert } from "../utils/pki";
import { useHttpProxy } from "./HttpProxy/HttpProxy";
import { useCallback, useContext, useEffect, useState, useMemo } from "react";
import StatusContext from "@/context/StatusContext";
import SessionContext from "@/context/SessionContext";
import { MdocIacasResponse, MdocIacasResponseSchema } from "../schemas/MdocIacasResponseSchema";

export function useOpenID4VCIHelper(): IOpenID4VCIHelper {
	const httpProxy = useHttpProxy();
	const { isOnline } = useContext(StatusContext);
	const [shouldUseCache, setShouldUseCache] = useState(true)
	const { api } = useContext(SessionContext);

	useEffect(() => {
		const handleLogin = () => setShouldUseCache(false);
		window.addEventListener('login', handleLogin);

		return () => {
			window.removeEventListener('login', handleLogin);
		};
	}, []);

	const fetchAndCache = useCallback(
		async function fetchAndCache<T>(path: string, schema: any, isOnline: boolean, forceIndexDB: boolean): Promise<T> {
			console.log('fetchAndCache')
			if (!isOnline || forceIndexDB) {
				const cachedData = await getItem(path, path, "externalEntities");
				if (cachedData) return cachedData;
			}

			// Fetch from network if online
			try {
				const response = await httpProxy.get(path, {});
				if (!response) throw new Error("Couldn't get response");

				const parsedData = schema.parse(response.data);
				await addItem(path, path, parsedData, "externalEntities");  // Cache the fetched data
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
				const issuerResponse = await api.getExternalEntity('/issuer/all', undefined, true);
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
		[api]
	);

	// Fetches authorization server metadata with fallback
	const getAuthorizationServerMetadata = useCallback(
		async (credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null> => {
			const pathAuthorizationServer = `${credentialIssuerIdentifier}/.well-known/oauth-authorization-server`;
			const pathConfiguration = `${credentialIssuerIdentifier}/.well-known/openid-configuration`;
			console.log('getAuthorizationServerMetadata');
			try {
				const authzServeMetadata = await fetchAndCache<OpenidAuthorizationServerMetadata>(
					pathAuthorizationServer,
					OpenidAuthorizationServerMetadataSchema,
					isOnline,
					shouldUseCache
				);
				return { authzServeMetadata };
			} catch {
				// Fallback to openid-configuration if oauth-authorization-server fetch fails
				const authzServeMetadata = await fetchAndCache<OpenidAuthorizationServerMetadata>(
					pathConfiguration,
					OpenidAuthorizationServerMetadataSchema,
					isOnline,
					shouldUseCache
				).catch(() => null);

				if (!authzServeMetadata) {
					return null;
				}
				return { authzServeMetadata };
			}
		},
		[fetchAndCache, isOnline, shouldUseCache]
	);

	const getCredentialIssuerMetadata = useCallback(
		async (credentialIssuerIdentifier: string): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null> => {
			const pathCredentialIssuer = `${credentialIssuerIdentifier}/.well-known/openid-credential-issuer`;
			console.log('getCredentialIssuerMetadata');
			try {
				const metadata = await fetchAndCache<OpenidCredentialIssuerMetadata>(
					pathCredentialIssuer,
					OpenidCredentialIssuerMetadataSchema,
					isOnline,
					shouldUseCache
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
		[fetchAndCache, isOnline, shouldUseCache]
	);


	const getMdocIacas = useCallback(
		async (credentialIssuerIdentifier: string) => {
			console.log('getClientId');
			try {
				const { metadata } = await getCredentialIssuerMetadata(credentialIssuerIdentifier);
				if (metadata.mdoc_iacas_uri) {
					const response = await fetchAndCache<MdocIacasResponse>(
						`${metadata.mdoc_iacas_uri}`,
						MdocIacasResponseSchema,
						isOnline,
						shouldUseCache,
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
		[api]
	);

	return useMemo(
		() => ({
			getClientId,
			getAuthorizationServerMetadata,
			getCredentialIssuerMetadata,
			getMdocIacas,
		}),
		[
			getClientId,
			getAuthorizationServerMetadata,
			getCredentialIssuerMetadata,
			getMdocIacas,
		]
	);
}
