"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveIssuerMetadata = resolveIssuerMetadata;
exports.getSdJwtVcMetadata = getSdJwtVcMetadata;
const verifySRIFromObject_1 = require("./verifySRIFromObject");
const error_1 = require("../error");
const SdJwtVcTypeMetadataSchema_1 = require("../schemas/SdJwtVcTypeMetadataSchema");
function validateTypeMetadataShape(metadata) {
    const res = SdJwtVcTypeMetadataSchema_1.TypeMetadata.safeParse(metadata);
    if (!res.success) {
        console.error("❌ Type Metadata shape validation failed:", res.error.issues);
        return { ok: false, code: error_1.CredentialParsingError.SchemaShapeFail };
    }
    return { ok: true, data: res.data };
}
function handleMetadataCode(code, warnings) {
    if ((0, error_1.isCredentialParsingWarnings)(code)) {
        warnings.push({ code });
        return undefined; // continue flow
    }
    else {
        console.warn(`❌ Metadata Error [${code}]`);
        return { error: code }; // now error
    }
}
function deepMerge(parent, child) {
    if (Array.isArray(parent) && Array.isArray(child)) {
        // Merge display[] by locale
        if (parent[0]?.locale && child[0]?.locale) {
            const map = new Map();
            for (const item of parent) {
                map.set(item.locale, item);
            }
            for (const item of child) {
                if (map.has(item.locale)) {
                    // Recursively merge item with same locale
                    const merged = deepMerge(map.get(item.locale), item);
                    map.set(item.locale, merged);
                }
                else {
                    map.set(item.locale, item);
                }
            }
            return Array.from(map.values());
        }
        // Merge claims[] by path
        if (parent[0]?.path && child[0]?.path) {
            const map = new Map();
            for (const item of parent) {
                map.set(JSON.stringify(item.path), item);
            }
            for (const item of child) {
                if (map.has(JSON.stringify(item.path))) {
                    const merged = deepMerge(map.get(JSON.stringify(item.path)), item);
                    map.set(JSON.stringify(item.path), merged);
                }
                else {
                    map.set(JSON.stringify(item.path), item);
                }
            }
            return Array.from(map.values());
        }
        // If they're not arrays of objects (i.e., primitives), override with child
        if (typeof parent[0] !== 'object' ||
            typeof child[0] !== 'object' ||
            parent[0] === null ||
            child[0] === null) {
            return child;
        }
        // Otherwise, merge arrays of objects (default behavior)
        return [...parent, ...child];
    }
    if (typeof parent === 'object' && typeof child === 'object' && parent !== null && child !== null) {
        const result = { ...parent };
        for (const key of Object.keys(child)) {
            if (key in parent) {
                result[key] = deepMerge(parent[key], child[key]); // RECURSIVE
            }
            else {
                result[key] = child[key];
            }
        }
        return result;
    }
    // Primitives: child overrides
    return child;
}
async function fetchAndMergeMetadata(vctResolutionEngine, subtle, httpClient, metadataId, visited = new Set(), integrity, warnings = []) {
    if (visited.has(metadataId)) {
        const resultCode = handleMetadataCode(error_1.CredentialParsingError.InfiniteRecursion, warnings);
        if (resultCode)
            return resultCode;
    }
    visited.add(metadataId);
    let metadata;
    // HTTP (only if valid URL)
    if (isValidHttpUrl(metadataId)) {
        const res = await httpClient.get(metadataId, {}, { useCache: true });
        if (res &&
            res.status === 200 &&
            typeof res.data === 'object' &&
            res.data !== null &&
            'vct' in res.data) {
            const validated = validateTypeMetadataShape(res.data);
            if (!validated.ok) {
                const resultCode = handleMetadataCode(validated.code, warnings);
                if (resultCode)
                    return resultCode;
            }
            else {
                metadata = validated.data;
            }
        }
    }
    // Registry
    if (!metadata && vctResolutionEngine) {
        const maybe = await vctResolutionEngine.getVctMetadataDocument(metadataId);
        if (maybe?.ok) {
            metadata = maybe.value;
        }
        else if (maybe?.error === "invalid_schema") {
            const resultCode = handleMetadataCode(error_1.CredentialParsingError.SchemaShapeFail, warnings);
            if (resultCode)
                return resultCode;
        }
    }
    if (!metadata)
        return undefined;
    if (integrity) {
        const isValid = await (0, verifySRIFromObject_1.verifySRIFromObject)(subtle, metadata, integrity);
        if (!isValid) {
            const resultCode = handleMetadataCode(error_1.CredentialParsingError.IntegrityFail, warnings);
            if (resultCode)
                return resultCode;
        }
    }
    let merged;
    if (typeof metadata.extends === 'string') {
        const childIntegrity = metadata['extends#integrity'];
        const parent = await fetchAndMergeMetadata(vctResolutionEngine, subtle, httpClient, metadata.extends, visited, childIntegrity, warnings);
        if (parent === undefined) {
            const resultCode = handleMetadataCode(error_1.CredentialParsingError.NotFoundExtends, warnings);
            if (resultCode)
                return resultCode;
            return metadata;
        }
        if ('error' in parent)
            return parent;
        merged = deepMerge(parent, metadata);
    }
    else {
        merged = metadata;
    }
    return merged;
}
async function resolveIssuerMetadata(httpClient, issuerUrl) {
    try {
        const issUrl = new URL(issuerUrl);
        const result = await httpClient.get(`${issUrl.origin}/.well-known/jwt-vc-issuer`, {}, { useCache: true });
        if (result &&
            typeof result === 'object' &&
            ('data' in result) &&
            typeof result.data === 'object' &&
            typeof result.data.issuer === 'string') {
            if (result.data.issuer !== issUrl.origin) {
                return { code: error_1.CredentialParsingError.JwtVcIssuerMismatch };
            }
        }
        return undefined;
    }
    catch (err) {
        return { code: error_1.CredentialParsingError.JwtVcIssuerFail };
    }
}
function isValidHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol.startsWith('http');
    }
    catch {
        return false;
    }
}
async function getSdJwtVcMetadata(vctResolutionEngine, subtle, httpClient, vct, vctIntegrity, warnings = []) {
    try {
        if (vct && typeof vct === 'string') {
            // TODO: Move to SDJWTVCVerifier
            // Check jwt-vc-issuer by iss
            // if (isValidHttpUrl(vct)) {
            // 	const checkIssuer = await resolveIssuerMetadata(httpClient, credentialPayload.iss);
            // 	if (checkIssuer) {
            // 		const resultCode = handleMetadataCode(checkIssuer.code, warnings);
            // 		if (resultCode) return resultCode;
            // 	}
            // }
            try {
                const mergedMetadata = await fetchAndMergeMetadata(vctResolutionEngine, subtle, httpClient, vct, new Set(), vctIntegrity, warnings);
                if (mergedMetadata) {
                    if ('error' in mergedMetadata) {
                        return { error: mergedMetadata.error };
                    }
                    else {
                        return { credentialMetadata: mergedMetadata, warnings };
                    }
                }
            }
            catch (e) {
                console.warn('Invalid vct URL:', vct, e);
            }
        }
        // if no metafata found return NotFound
        warnings.push({ code: error_1.CredentialParsingError.NotFound });
        return { credentialMetadata: undefined, warnings };
    }
    catch (err) {
        console.log(err);
        return { error: error_1.CredentialParsingError.UnknownError };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0U2RKd3RWY01ldGFkYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2dldFNkSnd0VmNNZXRhZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXVMQSxzREF3QkM7QUFXRCxnREFxQ0M7QUE5UEQsK0RBQTREO0FBRTVELG9DQUErRTtBQUMvRSxvRkFBMEY7QUFHMUYsU0FBUyx5QkFBeUIsQ0FDakMsUUFBaUI7SUFFakIsTUFBTSxHQUFHLEdBQUcsd0NBQWtCLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDbEIsT0FBTyxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzVFLE9BQU8sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSw4QkFBc0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUNwRSxDQUFDO0lBQ0QsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNyQyxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDMUIsSUFBNEIsRUFDNUIsUUFBMkI7SUFHM0IsSUFBSSxJQUFBLG1DQUEyQixFQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDdkMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFDeEIsT0FBTyxTQUFTLENBQUMsQ0FBQyxnQkFBZ0I7SUFDbkMsQ0FBQztTQUFNLENBQUM7UUFDUCxPQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxZQUFZO0lBQ3JDLENBQUM7QUFDRixDQUFDO0FBRUQsU0FBUyxTQUFT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