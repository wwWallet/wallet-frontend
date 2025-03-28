import { HttpClient } from '../interfaces';
import { fromBase64 } from './util';
import { verifySRIFromObject } from './verifySRIFromObject';

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
): Promise<Record<string, any>> {
	if (visited.has(url)) {
		console.warn(`Cycle detected or already visited: ${url}`);
		return {};
	}
	visited.add(url);

	// console.log(`Fetching metadata from: ${url}`);
	const result = await httpClient.get(url);
	// console.log(`HTTP GET ${url} → status: ${result?.status}`);

	if (
		!result ||
		result.status !== 200 ||
		typeof result.data !== 'object' ||
		result.data === null ||
		!('vct' in result.data)
	) {
		throw new Error(`Invalid metadata from ${url}`);
	}

	const current = result.data as {
		vct: string;
		extends?: string;
		'extends#integrity'?: string;
		[key: string]: any;
	};
	// console.log(`Fetched metadata from ${url}:`, current);

	if (integrity) {
		const isValid = verifySRIFromObject(result.data, integrity);
		if (!isValid) {
			throw new Error(`#integrity check failed for url: ${url}`);
		}
		// console.log(`#integrity check success for url: ${url} and ${integrity}`)
	} else {
		throw new Error(`Missing integrity for metadata at ${url}`);
	}

	let merged = {};

	if (typeof current.extends === 'string') {
		// console.log(`Found extends → ${current.extends}`);
		const childIntegrity = current['extends#integrity'] as string | undefined;
		const parent = await fetchAndMergeMetadata(httpClient, current.extends, visited, childIntegrity);
		merged = deepMerge(parent, current); // child overrides
	} else {
		merged = current;
		// console.log(`No extends found in ${url}`);
	}

	// console.log(`Final merged metadata from ${url}:`, merged);
	return merged;
}

export async function resolveIssuerMetadata(httpClient: any, issuerUrl: string): Promise<{ valid: true } | { error: "NOT_FOUND" }> {
	try {
		const issUrl = new URL(issuerUrl);
		if (!issUrl?.origin) return { error: "NOT_FOUND" };

		const result = await httpClient.get(`${issUrl.origin}/.well-known/jwt-vc-issuer`) as {
			data: { issuer: string };
		};

		if (result.data?.issuer !== issUrl.origin) {
			return { error: "NOT_FOUND" };
		}

		return { valid: true };
	} catch (err) {
		return { error: "NOT_FOUND" };
	}
}

export async function getSdJwtVcMetadata(httpClient: HttpClient, credential: string): Promise<{ credentialMetadata: any } | { error: "NOT_FOUND" }> {
	try {
		const credentialHeader = JSON.parse(new TextDecoder().decode(fromBase64(credential.split('.')[0] as string)));
		const credentialPayload = JSON.parse(new TextDecoder().decode(fromBase64(credential.split('.')[1] as string)));

		// console.log('Decoded credential header:', credentialHeader);
		// console.log('Decoded credential payload:', credentialPayload);

		const checkIssuer = await resolveIssuerMetadata(httpClient, credentialPayload.iss);
		if ('error' in checkIssuer) {
			return { error: "NOT_FOUND" };
		}

		const vct = credentialPayload.vct;
		if (vct && typeof vct === 'string') {
			try {
				const url = new URL(vct);
				if (url.protocol.startsWith('http')) {
					// console.log(`Resolving metadata from vct: ${vct}`);
					const vctIntegrity = credentialPayload['vct#integrity'] as string | undefined;
					const mergedMetadata = await fetchAndMergeMetadata(httpClient, vct, new Set(), vctIntegrity);
					// console.log(`Final merged credential metadata from ${vct}:`, mergedMetadata);
					return { credentialMetadata: mergedMetadata };
				}
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
