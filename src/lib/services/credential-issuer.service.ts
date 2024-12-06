import ProxyClient from '../http/proxy-client';
import LocalApiClient from '../http/local-api-client';
import { OpenidAuthorizationServerMetadata, OpenidAuthorizationServerMetadataSchema } from '../schemas/OpenidAuthorizationServerMetadataSchema';
import {
	OpenidCredentialIssuerMetadata,
	OpenidCredentialIssuerMetadataSchema,
} from '../schemas/OpenidCredentialIssuerMetadataSchema';

const PATH_OPEN_ID_CREDENTIAL_ISSUER = '/.well-known/openid-credential-issuer';
const PATH_OAUTH_AUTHORIZATION_SERVER = '/.well-known/oauth-authorization-server';
const PATH_OPEN_ID_CONFIGURATION = '/.well-known/openid-configuration';
const PATH_DID = '/.well-known/did.json';

interface Did {
	id: string;
}

export const getIssuerConfiguration = async (
	credentialIssuer: string,
	isOnline: boolean = true,
	useCache: boolean = false,
): Promise<{ metadata: OpenidCredentialIssuerMetadata } | OpenidCredentialIssuerMetadata> => {
	const path = `${credentialIssuer}${PATH_OPEN_ID_CREDENTIAL_ISSUER}`;

	if (!isOnline || useCache) {
		const cachedData = await LocalApiClient.get(path, path);
		if (cachedData) return cachedData;
	}

	try {
		const response = await ProxyClient.get(path, {
			'Cache-Control': 'no-cache',
		});

		const data = response.data || response;
		// const parsedData = OpenidCredentialIssuerMetadataSchema.parse(data);
		const parsedData = data;
		await LocalApiClient.post(path, path, parsedData);

		return { metadata: parsedData };
	} catch (err) {
		console.error(err);
		return;
	}
};

export const getAuthorizationServerMetadata = async (
	credentialIssuer: string,
	isOnline: boolean = true,
	useCache: boolean = false,
): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata }> => {
	try {
		return await getAuthorizationServerOAuthMetadata(credentialIssuer, isOnline, useCache);
	} catch {
		return await getAuthorizationServerOpenIDMetadata(credentialIssuer, isOnline, useCache);
	}
};

export const getAuthorizationServerOAuthMetadata = async (
	credentialIssuer: string,
	isOnline: boolean = true,
	useCache: boolean = false,
): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata }> => {
	const path = `${credentialIssuer}${PATH_OAUTH_AUTHORIZATION_SERVER}`;

	if (!isOnline || useCache) {
		const cachedData = await LocalApiClient.get(path, path);
		if (cachedData) return cachedData;
	}

	try {
		const { data } = await ProxyClient.get(path, {
			'Cache-Control': 'no-cache',
		});

		const parsedData = OpenidAuthorizationServerMetadataSchema.parse(data);
		await LocalApiClient.post(path, path, parsedData);

		return { authzServeMetadata: parsedData };
	} catch (err) {
		console.error(err);
		return;
	}
};

export const getAuthorizationServerOpenIDMetadata = async (
	credentialIssuer: string,
	isOnline: boolean = true,
	useCache: boolean = false,
): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata }> => {
	const path = `${credentialIssuer}${PATH_OPEN_ID_CONFIGURATION}`;

	if (!isOnline || useCache) {
		const cachedData = await LocalApiClient.get(path, path);
		if (cachedData) return cachedData;
	}

	try {
		const { data } = await ProxyClient.get(path, {
			'Cache-Control': 'no-cache',
		});

		const parsedData = OpenidAuthorizationServerMetadataSchema.parse(data);
		await LocalApiClient.post(path, path, parsedData);

		return { authzServeMetadata: parsedData };
	} catch (err) {
		console.error(err);
		return;
	}
};

export const getDid = async (credentialIssuer: string): Promise<Did> => {
	const path = `${credentialIssuer}${PATH_DID}`;

	try {
		const { data } = await ProxyClient.get(path, {
			'Cache-Control': 'no-cache',
		});

		return data;
	} catch (err) {
		console.error(err);
		return;
	}
};
