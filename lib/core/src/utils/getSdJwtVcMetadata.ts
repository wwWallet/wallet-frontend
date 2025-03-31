import { HttpClient } from '../interfaces';
import { fromBase64 } from './util';
import { verifySRIFromObject } from './verifySRIFromObject';

type MetadataErrorCode =
	| "NOT_FOUND"
	| "INTEGRITY_FAIL"
	| "INTEGRITY_MISSING"
	| "ISSUER_MISMATCH";

type MetadataError = { error: MetadataErrorCode };

function deepMerge(parent: any, child: any): any {

	if (Array.isArray(parent) && Array.isArray(child)) {
		// Merge display[] by lang
		if (parent[0]?.lang && child[0]?.lang) {
			const map = new Map<string, any>();

			for (const item of parent) {
				map.set(item.lang, item);
			}
			for (const item of child) {
				if (map.has(item.lang)) {
					// Recursively merge item with same lang
					const merged = deepMerge(map.get(item.lang), item);
					map.set(item.lang, merged);
				} else {
					map.set(item.lang, item);
				}
			}
			return Array.from(map.values());
		}

		// Merge claims[] by path
		if (parent[0]?.path && child[0]?.path) {
			const map = new Map<string, any>();

			for (const item of parent) {
				map.set(JSON.stringify(item.path), item);
			}
			for (const item of child) {
				if (map.has(JSON.stringify(item.path))) {
					const merged = deepMerge(map.get(JSON.stringify(item.path)), item);
					map.set(JSON.stringify(item.path), merged);
				} else {
					map.set(JSON.stringify(item.path), item);
				}
			}
			return Array.from(map.values());
		}

		// Default: just concat arrays
		return [...parent, ...child];
	}

	if (typeof parent === 'object' && typeof child === 'object' && parent !== null && child !== null) {
		const result: Record<string, any> = { ...parent };
		for (const key of Object.keys(child)) {
			if (key in parent) {
				result[key] = deepMerge(parent[key], child[key]); // RECURSIVE
			} else {
				result[key] = child[key];
			}
		}
		return result;
	}

	// Primitives: child overrides
	return child;
}

async function fetchAndMergeMetadata(
	httpClient: HttpClient,
	url: string,
	visited = new Set<string>(),
	integrity?: string
): Promise<Record<string, any> | MetadataError> {
	if (visited.has(url)) {
		return { error: "NOT_FOUND" };
	}
	visited.add(url);

	const result = await httpClient.get(url);

	if (
		!result ||
		result.status !== 200 ||
		typeof result.data !== 'object' ||
		result.data === null ||
		!('vct' in result.data)
	) {
		return { error: "NOT_FOUND" };
	}

	if (!integrity) return { error: "INTEGRITY_MISSING" };

	const isValid = verifySRIFromObject(result.data, integrity);
	if (!isValid) return { error: "INTEGRITY_FAIL" };

	const current = result.data as {
		vct: string;
		extends?: string;
		'extends#integrity'?: string;
		[key: string]: any;
	};

	let merged = {};

	if (typeof current.extends === 'string') {
		const childIntegrity = current['extends#integrity'] as string | undefined;
		const parent = await fetchAndMergeMetadata(httpClient, current.extends, visited, childIntegrity);
		if ('error' in parent) return parent;
		merged = deepMerge(parent, current);
	} else {
		merged = current;
	}
	return merged;
}

export async function resolveIssuerMetadata(httpClient: any, issuerUrl: string): Promise<{ valid: true } | MetadataError> {
	try {
		const issUrl = new URL(issuerUrl);
		if (!issUrl?.origin) return { error: "NOT_FOUND" };

		const result = await httpClient.get(`${issUrl.origin}/.well-known/jwt-vc-issuer`) as {
			data: { issuer: string };
		};

		if (result.data?.issuer !== issUrl.origin) {
			return { error: 'ISSUER_MISMATCH' };
		}

		return { valid: true };
	} catch (err) {
		return { error: "NOT_FOUND" };
	}
}

function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol.startsWith('http');
	} catch {
		return false;
	}
}

export async function getSdJwtVcMetadata(httpClient: HttpClient, credential: string): Promise<{ credentialMetadata: any } | MetadataError> {
	try {
		const credentialHeader = JSON.parse(new TextDecoder().decode(fromBase64(credential.split('.')[0] as string)));
		const credentialPayload = JSON.parse(new TextDecoder().decode(fromBase64(credential.split('.')[1] as string)));

		if (!credentialHeader || !credentialPayload) {
			return { error: "NOT_FOUND" };
		}
		// console.log('Decoded credential header:', credentialHeader);
		// console.log('Decoded credential payload:', credentialPayload);

		const checkIssuer = await resolveIssuerMetadata(httpClient, credentialPayload.iss);
		if ('error' in checkIssuer) {
			return { error: checkIssuer.error };
		}

		const vct = credentialPayload.vct;
		if (vct && typeof vct === 'string' && isValidHttpUrl(vct)) {
			try {
				const vctIntegrity = credentialPayload['vct#integrity'] as string | undefined;
				const mergedMetadata = await fetchAndMergeMetadata(httpClient, vct, new Set(), vctIntegrity);
				if ('error' in mergedMetadata) {
					return { error: mergedMetadata.error }
				}
				return { credentialMetadata: mergedMetadata };
			} catch (e) {
				console.warn('Invalid vct URL:', vct, e);
			}
		}

		if (credentialHeader.vctm) {
			const sdjwtvcMetadataDocument = credentialHeader.vctm.map((encodedMetadataDocument: string) =>
				JSON.parse(new TextDecoder().decode(fromBase64(encodedMetadataDocument)))
			).filter(((metadataDocument: Record<string, unknown>) => metadataDocument.vct === credentialPayload.vct))[0];
			if (sdjwtvcMetadataDocument) {
				return { credentialMetadata: sdjwtvcMetadataDocument };
			}
		}

		return { error: "NOT_FOUND" };
	}
	catch (err) {
		console.log(err);
		return { error: "NOT_FOUND" };
	}
}
