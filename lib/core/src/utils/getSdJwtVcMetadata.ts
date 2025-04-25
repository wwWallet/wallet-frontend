import { Context, HttpClient } from '../interfaces';
import { fromBase64 } from './util';
import { verifySRIFromObject } from './verifySRIFromObject';
import Ajv2020 from "ajv/dist/2020";

type MetadataErrorCode =
	| "NOT_FOUND"
	| "INTEGRITY_FAIL"
	| "INTEGRITY_MISSING"
	| "ISSUER_MISMATCH"
	| "SCHEMA_CONFLICT"
	| "SCHEMA_FAIL";

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

		// If they're not arrays of objects (i.e., primitives), override with child
		if (
			typeof parent[0] !== 'object' ||
			typeof child[0] !== 'object' ||
			parent[0] === null ||
			child[0] === null
		) {
			return child;
		}

		// Otherwise, merge arrays of objects (default behavior)
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

export function validateAgainstSchema(
	schema: Record<string, any>,
	dataToValidate?: Record<string, any>
): { valid: true } | MetadataError {
	// console.log('Schema to validate:', schema);
	// console.log('Data to validate against schema:', dataToValidate);

	const ajv = new Ajv2020();

	// 1. Validate the schema itself
	const isSchemaValid = ajv.validateSchema(schema);
	if (!isSchemaValid) {
		console.warn('❌ Invalid schema structure:', ajv.errors);
		return { error: "SCHEMA_FAIL" };
	}

	// 2. If data is provided, validate it against the schema
	if (dataToValidate) {
		try {
			const validate = ajv.compile(schema);
			const isValid = validate(dataToValidate);
			if (!isValid) {
				console.warn('❌ Data does not conform to schema:', validate.errors);
				return { error: "SCHEMA_FAIL" };
			}
		} catch (err) {
			console.warn('⚠️ Error during schema compilation/validation:', err);
			return { error: "SCHEMA_FAIL" };
		}
	}

	return { valid: true };
}

async function fetchAndMergeMetadata(
	context: Context,
	httpClient: HttpClient,
	metadataId: string,
	metadataObj?: Object,
	visited = new Set<string>(),
	integrity?: string,
	credentialPayload?: Record<string, any>
): Promise<Record<string, any> | MetadataError> {

	if (visited.has(metadataId)) {
		return { error: "NOT_FOUND" };
	}
	visited.add(metadataId);

	let metadata;
	if (metadataObj) {
		metadata = metadataObj as Record<string, any>;
	} else {
		const result = await httpClient.get(metadataId);

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

		const isValid = verifySRIFromObject(context, result.data, integrity);
		if (!isValid) return { error: "INTEGRITY_FAIL" };
		metadata = result.data as Record<string, any>;
	}

	if ('schema' in metadata && 'schema_uri' in metadata) {
		return { error: "SCHEMA_CONFLICT" };
	}

	if ('schema' in metadata) {
		const resultValidate = validateAgainstSchema(metadata.schema, credentialPayload);
		if ('error' in resultValidate) {
			return resultValidate;
		}
	}

	if (metadata.schema_uri && typeof metadata.schema_uri === 'string') {
		const schemaIntegrity = metadata['schema_uri#integrity'];
		if (!schemaIntegrity) {
			return { error: "INTEGRITY_MISSING" };
		}

		const resultSchema = await httpClient.get(metadata.schema_uri);
		if (
			!resultSchema ||
			resultSchema.status !== 200 ||
			typeof resultSchema.data !== 'object' ||
			resultSchema.data === null
		) {
			return { error: "NOT_FOUND" };
		}

		if (!verifySRIFromObject(context, resultSchema.data, schemaIntegrity)) {
			return { error: "INTEGRITY_FAIL" };
		}

		const resultValidate = validateAgainstSchema(resultSchema.data, credentialPayload);
		if ('error' in resultValidate) {
			return resultValidate;
		}

		// Inject schema into metadata before assigning it to `current`
		metadata = {
			...metadata,
			schema: resultSchema.data,
		};
	}

	let merged: Record<string, any> = {};

	if (typeof metadata.extends === 'string') {
		const childIntegrity = metadata['extends#integrity'] as string | undefined;
		const parent = await fetchAndMergeMetadata(context, httpClient, metadata.extends, undefined, visited, childIntegrity);
		if ('error' in parent) return parent;
		merged = deepMerge(parent, metadata);
	} else {
		merged = metadata;
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

export async function getSdJwtVcMetadata(context: Context, httpClient: HttpClient, credential: string): Promise<{ credentialMetadata: any } | MetadataError> {
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
				const mergedMetadata = await fetchAndMergeMetadata(context, httpClient, vct, undefined, new Set(), vctIntegrity, credentialPayload);
				if ('error' in mergedMetadata) {
					return { error: mergedMetadata.error }
				}
				console.log('Final Metadata:', mergedMetadata);
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
				console.log('sdjwtvcMetadataDocument', sdjwtvcMetadataDocument);
				const vctmMergedMetadata = await fetchAndMergeMetadata(context, httpClient, sdjwtvcMetadataDocument.vct, sdjwtvcMetadataDocument, new Set(), undefined, credentialPayload);
				if ('error' in vctmMergedMetadata) {
					return { error: vctmMergedMetadata.error }
				}
				console.log('Final vctm Metadata:', vctmMergedMetadata);
				return { credentialMetadata: vctmMergedMetadata };
			}
		}

		return { error: "NOT_FOUND" };
	}
	catch (err) {
		console.log(err);
		return { error: "NOT_FOUND" };
	}
}
