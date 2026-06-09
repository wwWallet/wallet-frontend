"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenID4VPServerAPI = exports.HandleAuthorizationRequestErrors = void 0;
const core_1 = require("@sd-jwt/core");
const cbor_1 = require("@auth0/mdl/lib/cbor");
const mdl_1 = require("@auth0/mdl");
const jose_1 = require("jose");
const dcql_1 = require("dcql");
const utils_1 = require("../../utils");
const types_1 = require("./types");
const types_2 = require("../../types");
exports.HandleAuthorizationRequestErrors = {
    NON_SUPPORTED_CLIENT_ID_SCHEME: "non_supported_client_id_scheme",
    INSUFFICIENT_CREDENTIALS: "insufficient_credentials",
    MISSING_DCQL_QUERY: "missing_dcql_query",
    NONTRUSTED_VERIFIER: "nontrusted_verifier",
    INVALID_RESPONSE_MODE: "invalid_response_mode",
    OLD_STATE: "old_state",
    INVALID_TRANSACTION_DATA: "invalid_transaction_data",
    INVALID_TYP: "invalid_jwt_typ",
    COULD_NOT_RESOLVE_REQUEST: "could_not_resolve_request",
};
const decoder = new TextDecoder();
const encoder = new TextEncoder();
const certFromB64 = (certBase64) => `-----BEGIN CERTIFICATE-----\n${certBase64.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;
function isOpenID4VPResponseMode(value) {
    return typeof value === "string" && Object.values(types_1.OpenID4VPResponseMode).includes(value);
}
function getSubtleCrypto(subtle) {
    if (subtle)
        return subtle;
    if (globalThis.crypto?.subtle)
        return globalThis.crypto.subtle;
    throw new Error("Missing SubtleCrypto implementation");
}
function getRandomUUID(randomUUID) {
    if (randomUUID)
        return randomUUID();
    if (globalThis.crypto?.randomUUID)
        return globalThis.crypto.randomUUID();
    return (0, utils_1.generateRandomIdentifier)(16);
}
/**
 * Parse client_id to determine the scheme.
 * Supported schemes:
 * - x509_san_dns:domain.com
 * - did:web:domain.com (or did:jwk:...)
 * - https://domain.com
 * - pre-registered client_id (no scheme prefix)
 */
function parseClientIdScheme(clientId) {
    if (clientId.startsWith('x509_san_dns:')) {
        return {
            scheme: 'x509_san_dns',
            clientId,
            identifier: clientId.substring('x509_san_dns:'.length),
        };
    }
    if (clientId.startsWith('did:')) {
        return {
            scheme: 'did',
            clientId,
            identifier: clientId,
        };
    }
    if (clientId.startsWith('https://') || clientId.startsWith('http://')) {
        return {
            scheme: 'https',
            clientId,
            identifier: clientId,
        };
    }
    // Pre-registered or unknown scheme
    return {
        scheme: 'pre-registered',
        clientId,
        identifier: clientId,
    };
}
/**
 * Extract key material from parsed JWT header.
 * Returns x5c/jwk if embedded in header, or kid for DID-based resolution.
 */
function extractKeyMaterial(parsedHeader) {
    if (parsedHeader.x5c && Array.isArray(parsedHeader.x5c)) {
        return {
            type: 'x5c',
            key: parsedHeader.x5c,
        };
    }
    if (parsedHeader.jwk) {
        return {
            type: 'jwk',
            key: parsedHeader.jwk,
        };
    }
    // Return kid if present (key obtained via DID resolution)
    if (parsedHeader.kid && typeof parsedHeader.kid === 'string') {
        return {
            type: 'kid',
            key: parsedHeader.kid,
        };
    }
    // No key material found, return empty x5c
    return {
        type: 'x5c',
        key: [],
    };
}
const retrieveKeys = async (S, httpClient) => {
    if (S.client_metadata.jwks) {
        const rp_eph_pub_jwk = S.client_metadata.jwks.keys.filter((k) => k.use === "enc")[0];
        if (!rp_eph_pub_jwk) {
            throw new Error("Could not find Relying Party public key for encryption");
        }
        return { rp_eph_pub_jwk };
    }
    if (S.client_metadata.jwks_uri) {
        const response = await httpClient.get(S.client_metadata.jwks_uri).catch(() => null);
        if (response && typeof response.data === "object" && response.data && "keys" in response.data) {
            const keys = response.data.keys;
            const rp_eph_pub_jwk = keys.filter((k) => k.use === "enc")[0];
            if (!rp_eph_pub_jwk) {
                throw new Error("Could not find Relying Party public key for encryption");
            }
            return { rp_eph_pub_jwk };
        }
    }
    throw new Error("Could not find Relying Party public key for encryption");
};
class OpenID4VPServerAPI {
    deps;
    constructor(deps) {
        this.deps = deps;
    }
    parseAuthorizationParams(url) {
        const authorizationRequest = new URL(url);
        const searchParams = authorizationRequest.searchParams;
        return {
            client_id: searchParams.get("client_id"),
            response_uri: searchParams.get("response_uri"),
            nonce: searchParams.get("nonce"),
            state: searchParams.get("state"),
            client_metadata: searchParams.get("client_metadata")
                ? JSON.parse(searchParams.get("client_metadata"))
                : null,
            response_mode: searchParams.get("response_mode")
                ? JSON.parse(searchParams.get("response_mode"))
                : null,
            transaction_data: searchParams.get("transaction_data")
                ? JSON.parse(searchParams.get("transaction_data"))
                : null,
            request_uri: searchParams.get("request_uri"),
            dcql_query: searchParams.get("dcql_query")
                ? JSON.parse(searchParams.get("dcql_query"))
                : null,
        };
    }
    /**
     * Resolve a public key for JWT verification based on the header.
     *
     * Supports:
     * - x5c: Certificate chain (extracts public key from first cert)
     * - jwk: Embedded JWK in header
     * - kid with DID reference: Resolves DID document and finds matching key
     */
    async resolveVerificationKey(parsedHeader, clientId) {
        const alg = parsedHeader.alg;
        // Case 1: x5c certificate chain
        if (parsedHeader.x5c && Array.isArray(parsedHeader.x5c) && parsedHeader.x5c.length > 0) {
            try {
                const publicKey = await (0, jose_1.importX509)(certFromB64(parsedHeader.x5c[0]), alg);
                return { key: publicKey };
            }
            catch (e) {
                console.error("Failed to import x5c certificate:", e);
                return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
            }
        }
        // Case 2: Embedded JWK in header
        if (parsedHeader.jwk && typeof parsedHeader.jwk === "object") {
            try {
                const publicKey = await (0, jose_1.importJWK)(parsedHeader.jwk, alg);
                return { key: publicKey };
            }
            catch (e) {
                console.error("Failed to import embedded JWK:", e);
                return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
            }
        }
        // Case 3: kid reference (possibly to a DID document)
        const kid = parsedHeader.kid;
        if (kid) {
            // Check if client_id is a DID or if kid starts with did:
            const didToResolve = kid.startsWith("did:") ? kid.split("#")[0] :
                (clientId?.startsWith("did:") ? clientId : null);
            if (didToResolve) {
                // Need DID resolution
                if (!this.deps.resolveDid) {
                    console.error("DID resolution required but resolveDid dependency not provided");
                    return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
                }
                try {
                    const resolution = await this.deps.resolveDid(didToResolve);
                    if (!resolution.resolved || !resolution.didDocument) {
                        console.error("Failed to resolve DID:", didToResolve);
                        return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
                    }
                    const jwk = this.findKeyInDIDDocument(resolution.didDocument, kid);
                    if (!jwk) {
                        console.error("Key not found in DID document for kid:", kid);
                        return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
                    }
                    const publicKey = await (0, jose_1.importJWK)(jwk, alg);
                    return { key: publicKey };
                }
                catch (e) {
                    console.error("DID resolution or key import failed:", e);
                    return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
                }
            }
        }
        // No valid key material found
        console.error("No valid key material in JWT header (need x5c, jwk, or kid with DID)");
        return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
    }
    /**
     * Find a verification key in a DID document by kid.
     * Searches verificationMethod, authentication, and assertionMethod.
     */
    findKeyInDIDDocument(doc, kid) {
        // Normalize kid - could be full DID#fragment or just fragment
        const kidFragment = kid.includes("#") ? kid.split("#")[1] : kid;
        const fullKid = kid.includes("#") ? kid : `${doc.id}#${kid}`;
        // Helper to find a method in verificationMethod by reference ID
        const findInVerificationMethod = (refId) => {
            if (!doc.verificationMethod)
                return null;
            for (const vm of doc.verificationMethod) {
                if (vm.id === refId || vm.id === `${doc.id}#${refId}` || vm.id.split("#")[1] === refId) {
                    if (vm.publicKeyJwk) {
                        return vm.publicKeyJwk;
                    }
                }
            }
            return null;
        };
        // Search in verificationMethod array
        if (doc.verificationMethod) {
            for (const vm of doc.verificationMethod) {
                const vmId = vm.id;
                const vmFragment = vmId.includes("#") ? vmId.split("#")[1] : vmId;
                if (vmId === fullKid || vmId === kid || vmFragment === kidFragment) {
                    if (vm.publicKeyJwk) {
                        return vm.publicKeyJwk;
                    }
                }
            }
        }
        // Search in authentication (may contain inline methods or string references)
        if (doc.authentication) {
            for (const auth of doc.authentication) {
                // Handle string references to verificationMethod
                if (typeof auth === "string") {
                    const authFragment = auth.includes("#") ? auth.split("#")[1] : auth;
                    if (auth === fullKid || auth === kid || authFragment === kidFragment) {
                        const resolved = findInVerificationMethod(auth);
                        if (resolved)
                            return resolved;
                    }
                }
                // Handle inline objects
                if (typeof auth === "object" && "publicKeyJwk" in auth) {
                    const authId = auth.id;
                    const authFragment = authId.includes("#") ? authId.split("#")[1] : authId;
                    if (authId === fullKid || authId === kid || authFragment === kidFragment) {
                        if (auth.publicKeyJwk) {
                            return auth.publicKeyJwk;
                        }
                    }
                }
            }
        }
        // Search in assertionMethod (may contain inline methods or string references)
        if (doc.assertionMethod) {
            for (const am of doc.assertionMethod) {
                // Handle string references to verificationMethod
                if (typeof am === "string") {
                    const amFragment = am.includes("#") ? am.split("#")[1] : am;
                    if (am === fullKid || am === kid || amFragment === kidFragment) {
                        const resolved = findInVerificationMethod(am);
                        if (resolved)
                            return resolved;
                    }
                }
                // Handle inline objects
                if (typeof am === "object" && "publicKeyJwk" in am) {
                    const amId = am.id;
                    const amFragment = amId.includes("#") ? amId.split("#")[1] : amId;
                    if (amId === fullKid || amId === kid || amFragment === kidFragment) {
                        if (am.publicKeyJwk) {
                            return am.publicKeyJwk;
                        }
                    }
                }
            }
        }
        return null;
    }
    async handleRequestUri(request_uri) {
        const requestUriResponse = await this.deps.httpClient.get(request_uri, {});
        if (typeof requestUriResponse.data !== "string") {
            return { error: exports.HandleAuthorizationRequestErrors.COULD_NOT_RESOLVE_REQUEST };
        }
        const jwt = requestUriResponse.data;
        const [header, payload] = jwt.split(".");
        const parsedHeader = JSON.parse(decoder.decode(jose_1.base64url.decode(header)));
        if (parsedHeader.typ !== "oauth-authz-req+jwt") {
            return { error: exports.HandleAuthorizationRequestErrors.INVALID_TYP };
        }
        // Decode payload to get client_id for DID resolution
        const decodedPayload = JSON.parse(decoder.decode(jose_1.base64url.decode(payload)));
        const clientId = decodedPayload.client_id;
        // Resolve the verification key (supports x5c, jwk, and DID-based kid)
        const keyResult = await this.resolveVerificationKey(parsedHeader, clientId);
        if ("error" in keyResult) {
            return keyResult;
        }
        const verificationResult = await (0, jose_1.jwtVerify)(jwt, keyResult.key).catch(() => null);
        if (verificationResult == null) {
            return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
        }
        return { payload: decodedPayload, parsedHeader };
    }
    async matchCredentialsToDCQL(vcList, dcqlJson) {
        const descriptorPurpose = this.deps.strings.purposeNotSpecified ?? null;
        // shape all credentials in the wallet
        const shapedCredentials = [];
        for (const vc of vcList) {
            let shaped = { credential_format: vc.format };
            try {
                if (vc.format === types_2.VerifiableCredentialFormat.MSO_MDOC) {
                    const credentialBytes = jose_1.base64url.decode(vc.data);
                    const issuerSigned = (0, cbor_1.cborDecode)(credentialBytes);
                    const issuerAuth = issuerSigned.get("issuerAuth");
                    const payload = issuerAuth?.[2];
                    const decodedIssuerAuthPayload = (0, cbor_1.cborDecode)(payload);
                    const docType = decodedIssuerAuthPayload.data.get("docType");
                    const envelope = {
                        version: "1.0",
                        documents: [
                            new Map([
                                ["docType", docType],
                                ["issuerSigned", issuerSigned],
                            ]),
                        ],
                        status: 0,
                    };
                    const mdoc = (0, mdl_1.parse)((0, cbor_1.cborEncode)(envelope));
                    const [document] = mdoc.documents;
                    const nsName = document.issuerSignedNameSpaces[0];
                    const nsObject = document.getIssuerNameSpace(nsName);
                    shaped = {
                        credential_format: vc.format,
                        doctype: docType,
                        namespaces: {
                            [nsName]: nsObject,
                        },
                        batchId: vc.batchId,
                        cryptographic_holder_binding: true,
                    };
                }
                else {
                    // SD-JWT shaping
                    const parsed = await this.deps.parseCredential(vc);
                    if (!parsed) {
                        continue;
                    }
                    const { signedClaims } = parsed;
                    shaped.vct = signedClaims.vct;
                    shaped.claims = signedClaims;
                    shaped.cryptographic_holder_binding = true;
                    shaped.batchId = vc.batchId;
                }
                shapedCredentials.push(shaped);
            }
            catch (e) {
                console.error("DCQL shaping error for this VC:", e);
            }
        }
        if (shapedCredentials.length === 0) {
            return { error: exports.HandleAuthorizationRequestErrors.INSUFFICIENT_CREDENTIALS };
        }
        const parsedQuery = dcql_1.DcqlQuery.parse(dcqlJson);
        dcql_1.DcqlQuery.validate(parsedQuery);
        const result = dcql_1.DcqlQuery.query(parsedQuery, shapedCredentials);
        const matches = result.credential_matches;
        function hasValidMatch(credId) {
            const match = matches[credId];
            if (match?.success === false) {
                match.failed_credentials?.forEach((failedCreds) => {
                    if (failedCreds.meta.success === false) {
                        console.error("DCQL metadata issues: ", failedCreds.meta.issues);
                    }
                    if (!failedCreds.claims.success) {
                        console.error("DCQL failed claims: ", failedCreds.claims);
                    }
                });
            }
            return match?.success === true && Array.isArray(match.valid_credentials) && match.valid_credentials.length > 0;
        }
        const satisfied = dcqlJson.credentials.every((cred) => hasValidMatch(cred.id));
        if (!satisfied) {
            return { error: exports.HandleAuthorizationRequestErrors.INSUFFICIENT_CREDENTIALS };
        }
        // Build the mapping for each credential query
        const mapping = new Map();
        for (const credReq of dcqlJson.credentials) {
            const match = result.credential_matches[credReq.id];
            const conforming = [];
            if (match?.success && match.valid_credentials) {
                for (const vcMatch of match.valid_credentials) {
                    const shaped = shapedCredentials[vcMatch.input_credential_index];
                    if (shaped?.batchId !== undefined) {
                        conforming.push(shaped.batchId);
                    }
                }
            }
            mapping.set(credReq.id, {
                credentials: conforming,
                requestedFields: !credReq.claims || credReq.claims.length === 0
                    ? [{ name: this.deps.strings.allClaimsRequested, purpose: descriptorPurpose, path: [null] }]
                    : credReq.claims.map((cl) => ({
                        name: cl.id || cl.path.join("."),
                        purpose: descriptorPurpose,
                        path: cl.path,
                    })),
            });
        }
        const allConforming = Array.from(mapping.values()).flatMap((m) => m.credentials);
        if (allConforming.length === 0) {
            return { error: exports.HandleAuthorizationRequestErrors.INSUFFICIENT_CREDENTIALS };
        }
        return { mapping, descriptorPurpose };
    }
    convertDcqlToPresentationDefinition(dcql_query) {
        const pdId = getRandomUUID(this.deps.randomUUID);
        const input_descriptors = dcql_query.credentials.map((cred) => {
            const descriptorId = cred.meta?.doctype_value;
            const format = {};
            if (cred.format === "mso_mdoc") {
                format.mso_mdoc = { alg: ["ES256", "ES384", "EdDSA"] };
            }
            const fields = cred.claims.map((claim) => ({
                path: [`$['${cred.meta?.doctype_value}']${claim.path.slice(1).map((p) => `['${p}']`).join("")}`],
                intent_to_retain: claim.intent_to_retain ?? false,
            }));
            return {
                id: descriptorId,
                format,
                constraints: {
                    limit_disclosure: "required",
                    fields,
                },
            };
        });
        return {
            id: pdId,
            name: "DCQL-converted Presentation Definition",
            purpose: dcql_query.credential_sets?.[0]?.purpose ?? "No purpose defined",
            input_descriptors,
        };
    }
    generatePresentationFrameForDCQLPaths(paths) {
        const frame = {};
        for (const rawSegments of paths) {
            let current = frame;
            for (let i = 0; i < rawSegments.length; i++) {
                const segment = rawSegments[i];
                if (i === rawSegments.length - 1) {
                    current[segment] = true;
                }
                else {
                    current[segment] = current[segment] || {};
                    current = current[segment];
                }
            }
        }
        return frame;
    }
    async handleDCQLFlow(S, selectionMap, vcEntityList) {
        const { dcql_query, client_id, nonce, response_uri, transaction_data } = S;
        let apu = undefined;
        let apv = undefined;
        const generatedVPs = [];
        const originalVCs = [];
        for (const [selectionKey, batchId] of selectionMap) {
            const credential = await this.deps.selectCredentialForBatch(batchId, vcEntityList);
            if (!credential)
                continue;
            if (credential.format === types_2.VerifiableCredentialFormat.VC_SDJWT ||
                credential.format === types_2.VerifiableCredentialFormat.DC_SDJWT) {
                const descriptor = dcql_query.credentials.find((c) => c.id === selectionKey);
                if (!descriptor) {
                    throw new Error(`No DCQL descriptor for id ${selectionKey}`);
                }
                const parsed = await this.deps.parseCredential(credential);
                if (!parsed) {
                    throw new Error("Failed to parse credential");
                }
                const { signedClaims } = parsed;
                let paths;
                if (!descriptor.claims || descriptor.claims.length === 0) {
                    paths = [];
                    const getNestedPaths = (val, path) => {
                        if (val === null || typeof val !== "object") {
                            if (path.length)
                                paths.push(path);
                            return;
                        }
                        if (Array.isArray(val)) {
                            if (path.length) {
                                paths.push(path);
                            }
                            return;
                        }
                        const entries = Object.entries(val);
                        if (entries.length === 0) {
                            if (path.length) {
                                paths.push(path);
                            }
                            return;
                        }
                        for (const [k, v] of entries) {
                            getNestedPaths(v, path.concat(k));
                        }
                    };
                    getNestedPaths(signedClaims, []);
                }
                else {
                    paths = descriptor.claims.map((cl) => cl.path);
                }
                const frame = this.generatePresentationFrameForDCQLPaths(paths);
                const subtle = getSubtleCrypto(this.deps.subtle);
                const hasher = (data, alg) => {
                    const bytes = typeof data === "string" ? encoder.encode(data) : new Uint8Array(data);
                    return subtle.digest(alg, bytes).then((buf) => new Uint8Array(buf));
                };
                const sdJwt = await core_1.SDJwt.fromEncode(credential.data, hasher);
                const presentation = credential.data.split("~").length - 1 > 1
                    ? await sdJwt.present(frame, hasher)
                    : credential.data;
                const shaped = {
                    credential_format: credential.format,
                    vct: signedClaims.vct,
                    cryptographic_holder_binding: true,
                    claims: !descriptor.claims || descriptor.claims.length === 0
                        ? signedClaims
                        : Object.fromEntries(Object.entries(signedClaims).filter(([k]) => descriptor.claims.some((cl) => cl.path.includes(k))))
                };
                const presResult = dcql_1.DcqlPresentationResult.fromDcqlPresentation({ [selectionKey]: [shaped] }, { dcqlQuery: dcql_query });
                if (!presResult.credential_matches[selectionKey]?.success) {
                    throw new Error(`Presentation for '${selectionKey}' did not satisfy DCQL`);
                }
                let transactionDataResponseParams;
                if (transaction_data?.length && this.deps.transactionDataResponseGenerator) {
                    const [res, err] = await this.deps
                        .transactionDataResponseGenerator({ descriptor_id: selectionKey, dcql_query })
                        .generateTransactionDataResponse(transaction_data);
                    if (err) {
                        throw err;
                    }
                    if (res) {
                        transactionDataResponseParams = { ...res };
                    }
                }
                const { vpjwt } = await this.deps.keystore.signJwtPresentation(nonce, client_id, [presentation], transactionDataResponseParams);
                generatedVPs.push(vpjwt);
                originalVCs.push(credential);
            }
            else if (credential.format === types_2.VerifiableCredentialFormat.MSO_MDOC) {
                const descriptor = dcql_query.credentials.find((c) => c.id === selectionKey);
                if (!descriptor) {
                    throw new Error(`No DCQL descriptor for id ${selectionKey}`);
                }
                const descriptorId = descriptor.meta?.doctype_value;
                const credentialBytes = jose_1.base64url.decode(credential.data);
                const issuerSignedPayload = (0, cbor_1.cborDecode)(credentialBytes);
                const mdocStructure = {
                    version: "1.0",
                    documentErrors: [],
                    documents: [
                        new Map([
                            ["docType", descriptorId],
                            ["issuerSigned", issuerSignedPayload],
                        ]),
                    ],
                    status: 0,
                };
                const encoded = (0, cbor_1.cborEncode)(mdocStructure);
                const mdoc = (0, mdl_1.parse)(encoded);
                const mdocGeneratedNonce = (0, utils_1.generateRandomIdentifier)(8);
                apu = mdocGeneratedNonce;
                apv = nonce;
                let dcqlQueryWithClaims;
                if (!descriptor.claims || descriptor.claims.length === 0) {
                    dcqlQueryWithClaims = JSON.parse(JSON.stringify(dcql_query));
                    const nsName = mdoc.documents[0].issuerSignedNameSpaces[0];
                    const ns = mdoc.documents[0].getIssuerNameSpace(nsName);
                    const descriptorIndex = dcqlQueryWithClaims.credentials.findIndex((c) => c.id === selectionKey);
                    if (descriptorIndex !== -1) {
                        dcqlQueryWithClaims.credentials[descriptorIndex].claims = Object.keys(ns).map((key) => ({
                            id: key,
                            path: [descriptorId, key],
                        }));
                    }
                }
                else {
                    dcqlQueryWithClaims = dcql_query;
                }
                const presentationDefinition = this.convertDcqlToPresentationDefinition(dcqlQueryWithClaims);
                const { deviceResponseMDoc } = await this.deps.keystore.generateDeviceResponse(mdoc, presentationDefinition, apu, apv, client_id, response_uri);
                const encodedDeviceResponse = jose_1.base64url.encode(deviceResponseMDoc.encode());
                generatedVPs.push(encodedDeviceResponse);
                originalVCs.push(credential);
            }
        }
        const vpTokenObject = Object.fromEntries(Array.from(selectionMap.keys()).map((key, idx) => [key, [generatedVPs[idx]]]));
        const presentationSubmission = {
            id: (0, utils_1.generateRandomIdentifier)(8),
            descriptor_map: Array.from(selectionMap.keys()).map((id, idx) => ({ id, path: `$[${idx}]` })),
        };
        const formData = new URLSearchParams();
        if ([types_1.OpenID4VPResponseMode.DIRECT_POST_JWT, types_1.OpenID4VPResponseMode.DC_API_JWT].includes(S.response_mode) && S.client_metadata.authorization_encrypted_response_alg) {
            if (!S.client_metadata.authorization_encrypted_response_enc) {
                throw new Error("Missing authorization_encrypted_response_enc");
            }
            const { rp_eph_pub_jwk } = await retrieveKeys(S, this.deps.httpClient);
            const rp_eph_pub = await (0, jose_1.importJWK)(rp_eph_pub_jwk, S.client_metadata.authorization_encrypted_response_alg);
            const jwePayload = {
                vp_token: vpTokenObject,
                state: S.state ?? undefined,
            };
            const jwe = await new jose_1.EncryptJWT(jwePayload)
                .setKeyManagementParameters({ apu: new TextEncoder().encode(apu), apv: new TextEncoder().encode(apv) })
                .setProtectedHeader({
                alg: S.client_metadata.authorization_encrypted_response_alg,
                enc: S.client_metadata.authorization_encrypted_response_enc,
                kid: rp_eph_pub_jwk.kid,
            })
                .encrypt(rp_eph_pub);
            formData.append("response", jwe);
        }
        else {
            formData.append("vp_token", JSON.stringify(vpTokenObject));
            if (S.state)
                formData.append("state", S.state);
        }
        return { formData, generatedVPs, presentationSubmission, filteredVCEntities: originalVCs };
    }
    async handleAuthorizationRequest(url, vcEntityList) {
        let { client_id, response_uri, nonce, state, client_metadata, response_mode, transaction_data, request_uri, dcql_query, } = this.parseAuthorizationParams(url);
        if (!client_id) {
            return { error: exports.HandleAuthorizationRequestErrors.COULD_NOT_RESOLVE_REQUEST };
        }
        // Parse the client_id scheme
        let clientIdScheme = parseClientIdScheme(client_id);
        let parsedTransactionData = null;
        let trustInfo;
        if (request_uri) {
            try {
                const result = await this.handleRequestUri(request_uri);
                if ("error" in result) {
                    return result;
                }
                const { payload, parsedHeader } = result;
                client_id = payload.client_id;
                // Re-parse scheme after getting client_id from JWT payload
                clientIdScheme = parseClientIdScheme(client_id);
                dcql_query = payload.dcql_query ?? dcql_query;
                response_uri = (payload.response_uri ?? payload.redirect_uri);
                if (response_uri && !response_uri.startsWith("http")) {
                    response_uri = `https://${response_uri}`;
                }
                client_metadata = payload.client_metadata;
                response_mode = payload.response_mode ?? response_mode;
                if (payload.transaction_data) {
                    transaction_data = payload.transaction_data;
                    if (this.deps.parseTransactionData) {
                        parsedTransactionData = this.deps.parseTransactionData(transaction_data, dcql_query);
                        if (parsedTransactionData === null) {
                            return { error: exports.HandleAuthorizationRequestErrors.INVALID_TRANSACTION_DATA };
                        }
                    }
                }
                state = payload.state;
                nonce = payload.nonce;
                // Trust evaluation - all schemes delegated to AuthZEN backend
                const keyMaterial = extractKeyMaterial(parsedHeader);
                trustInfo = await this.deps.evaluateTrust({
                    clientIdScheme,
                    keyMaterial,
                    requestUri: request_uri,
                    responseUri: response_uri,
                });
                if (!trustInfo.trusted) {
                    console.error("Trust evaluation failed for verifier", client_id);
                    return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
                }
            }
            catch (e) {
                console.error("Failed to handle request_uri", e);
                return { error: exports.HandleAuthorizationRequestErrors.NONTRUSTED_VERIFIER };
            }
        }
        const lastUsedNonce = this.deps.lastUsedNonceStore?.get?.() ?? null;
        if (lastUsedNonce && lastUsedNonce === nonce) {
            return { error: exports.HandleAuthorizationRequestErrors.OLD_STATE };
        }
        if (!dcql_query) {
            return { error: exports.HandleAuthorizationRequestErrors.MISSING_DCQL_QUERY };
        }
        if (!isOpenID4VPResponseMode(response_mode)) {
            return { error: exports.HandleAuthorizationRequestErrors.INVALID_RESPONSE_MODE };
        }
        console.log("VC entity list = ", vcEntityList);
        const vcList = vcEntityList.filter((cred) => cred.instanceId === 0);
        await this.deps.rpStateStore.store({
            nonce: nonce ?? "",
            response_uri: response_uri ?? "",
            client_id: client_id ?? "",
            state: state ?? "",
            client_metadata: client_metadata ?? { vp_formats: {} },
            response_mode,
            transaction_data: transaction_data ?? [],
            dcql_query,
        });
        let matchResult;
        if (dcql_query) {
            matchResult = await this.matchCredentialsToDCQL(vcList, dcql_query);
        }
        if (matchResult && "error" in matchResult) {
            return { error: matchResult.error };
        }
        const { mapping, descriptorPurpose } = matchResult;
        // Use trust info name if available, otherwise derive from client_id
        let verifierDomainName;
        if (trustInfo?.name) {
            verifierDomainName = trustInfo.name;
        }
        else if (client_id.includes("http")) {
            verifierDomainName = new URL(client_id).hostname;
        }
        else if (clientIdScheme.scheme === 'did') {
            // For DID, extract domain from did:web: or use the full DID
            const didParts = client_id.split(':');
            if (didParts[1] === 'web' && didParts.length >= 3) {
                verifierDomainName = didParts[2].replace(/%3A/g, ':');
            }
            else {
                verifierDomainName = client_id;
            }
        }
        else if (clientIdScheme.scheme === 'x509_san_dns') {
            verifierDomainName = clientIdScheme.identifier;
        }
        else {
            verifierDomainName = client_id;
        }
        if (mapping.size === 0) {
            throw new Error("Credentials don't satisfy any descriptor");
        }
        return {
            conformantCredentialsMap: mapping,
            verifierDomainName,
            verifierPurpose: descriptorPurpose,
            parsedTransactionData,
            trustInfo,
        };
    }
    async createAuthorizationResponse(selectionMap, vcEntityList) {
        const S = await this.deps.rpStateStore.retrieve();
        if (!S || S.nonce === "" || (this.deps.lastUsedNonceStore?.get?.() ?? null) === S.nonce) {
            return {};
        }
        this.deps.lastUsedNonceStore?.set?.(S.nonce);
        const { formData, generatedVPs, presentationSubmission, filteredVCEntities } = await this.handleDCQLFlow(S, selectionMap, vcEntityList);
        return {
            formData,
            generatedVPs,
            presentationSubmission,
            filteredVCEntities,
            response_uri: S.response_uri,
            client_id: S.client_id,
            state: S.state,
        };
    }
}
exports.OpenID4VPServerAPI = OpenID4VPServerAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3BlbklENFZQU2VydmVyQVBJLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Byb3RvY29scy9vcGVuaWQ0dnAvT3BlbklENFZQU2VydmVyQVBJLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHVDQUFxQztBQUNyQyw4Q0FBNkQ7QUFDN0Qsb0NBQW1DO0FBQ25DLCtCQUE2RjtBQUM3RiwrQkFBeUQ7QUFDekQsdUNBQXVEO0FBQ3ZELG1DQWdCaUI7QUFDakIsdUNBQXlEO0FBQzVDLFFBQUEsZ0NBQWdDLEdBQUc7SUFDL0MsOEJBQThCLEVBQUUsZ0NBQWdDO0lBQ2hFLHdCQUF3QixFQUFFLDBCQUEwQjtJQUNwRCxrQkFBa0IsRUFBRSxvQkFBb0I7SUFDeEMsbUJBQW1CLEVBQUUscUJBQXFCO0lBQzFDLHFCQUFxQixFQUFFLHVCQUF1QjtJQUM5QyxTQUFTLEVBQUUsV0FBVztJQUN0Qix3QkFBd0IsRUFBRSwwQkFBMEI7SUFDcEQsV0FBVyxFQUFFLGlCQUFpQjtJQUM5Qix5QkFBeUIsRUFBRSwyQkFBMkI7Q0FDN0MsQ0FBQztBQTBEWCxNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDbEMsTUFBTSxXQUFXLEdBQUcsQ0FBQyxVQUFrQixFQUFFLEVBQUUsQ0FDMUMsZ0NBQWdDLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztBQUV2RyxTQUFTLHVCQUF1QixDQUFDLEtBQWM7SUFDOUMsT0FBTyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyw2QkFBcUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUE4QixDQUFDLENBQUM7QUFDbkgsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLE1BQXFCO0lBQzdDLElBQUksTUFBTTtRQUFF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