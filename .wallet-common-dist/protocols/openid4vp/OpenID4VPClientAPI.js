"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenID4VPClientAPI = exports.OpenID4VPClientErrors = void 0;
const core_1 = require("../../core");
const util_1 = require("../../utils/util");
const MsoMdocParser_1 = require("../../credential-parsers/MsoMdocParser");
const SDJWTVCParser_1 = require("../../credential-parsers/SDJWTVCParser");
const JWTVCJSONParser_1 = require("../../credential-parsers/JWTVCJSONParser");
const MsoMdocVerifier_1 = require("../../credential-verifiers/MsoMdocVerifier");
const SDJWTVCVerifier_1 = require("../../credential-verifiers/SDJWTVCVerifier");
const JWTVCJSONVerifier_1 = require("../../credential-verifiers/JWTVCJSONVerifier");
const CustomCredentialSvg_1 = require("../../functions/CustomCredentialSvg");
const ParsingEngine_1 = require("../../ParsingEngine");
const PublicKeyResolverEngine_1 = require("../../PublicKeyResolverEngine");
const rendering_1 = require("../../rendering");
const types_1 = require("../../types");
const util_2 = require("../../utils/util");
const transactionData_1 = require("./transactionData");
const dcql_1 = require("dcql");
const crypto_1 = require("crypto");
const jose_1 = require("jose");
const serializeDcqlQuery_1 = require("../../utils/serializeDcqlQuery");
exports.OpenID4VPClientErrors = {
    MissingRPStateForKid: "missing_rpstate_for_kid",
    MissingRPState: "missing_rpstate",
    JWEDecryptionFailure: "jwe_decryption_failure",
    MissingState: "missing_state",
    PresentationAlreadyCompleted: "presentation_already_completed",
    MissingVpToken: "missing_vp_token",
    MissingPresentationSubmissionAndVpToken: "missing_presentation_submission_and_vp_token",
    SignedRequestObjectInvalidated: "signed_request_object_invalidated"
};
const RESERVED_SDJWT_TOPLEVEL = new Set([
    'iss', 'sub', 'aud', 'nbf', 'exp', 'iat', 'jti', 'vct', 'cnf',
    'transaction_data_hashes', 'transaction_data_hashes_alg', 'vct#integrity'
]);
const decoder = new TextDecoder();
const encoder = new TextEncoder();
class OpenID4VPClientAPI {
    rpStateKV;
    options;
    httpClient;
    constructor(kvStore, options, httpClient) {
        this.rpStateKV = kvStore;
        this.options = options;
        this.httpClient = httpClient;
    }
    async initializeCredentialEngine() {
        console.log("Initializing credential engine...");
        const ctx = {
            clockTolerance: this.options.credentialEngineOptions.clockTolerance,
            subtle: this.options.credentialEngineOptions.subtle,
            lang: this.options.credentialEngineOptions.lang,
            trustedCertificates: [...this.options.credentialEngineOptions.trustedCertificates],
        };
        if (this.options.credentialEngineOptions.trustedCredentialIssuerIdentifiers) {
            const result = (await Promise.all(this.options.credentialEngineOptions.trustedCredentialIssuerIdentifiers.map(async (credentialIssuerIdentifier) => this.httpClient.get(`${credentialIssuerIdentifier}/openid/.well-known/openid-credential-issuer`)
                .then((res) => res.data)
                .catch((e) => { console.error(e); return null; })))).filter((r) => r !== null);
            const iacasResponses = (await Promise.all(result.map(async (metadata) => {
                if (metadata && metadata.mdoc_iacas_uri) {
                    return this.httpClient.get(metadata.mdoc_iacas_uri).then((res) => res.data).catch((e) => { console.error(e); return null; });
                }
                return null;
            }))).filter((r) => r !== null);
            for (const iacaResponse of iacasResponses) {
                const pemCertificates = iacaResponse.iacas?.map((cert) => cert.certificate ? `-----BEGIN CERTIFICATE-----\n${cert.certificate}\n-----END CERTIFICATE-----\n` : null) ?? [];
                for (const pem of pemCertificates) {
                    if (pem) {
                        ctx.trustedCertificates.push(pem);
                    }
                }
            }
        }
        const credentialParsingEngine = (0, ParsingEngine_1.ParsingEngine)();
        credentialParsingEngine.register((0, SDJWTVCParser_1.SDJWTVCParser)({ context: ctx, httpClient: this.httpClient }));
        console.log("Registered SDJWTVCParser...");
        credentialParsingEngine.register((0, MsoMdocParser_1.MsoMdocParser)({ context: ctx, httpClient: this.httpClient }));
        console.log("Registered MsoMdocParser...");
        credentialParsingEngine.register((0, JWTVCJSONParser_1.JWTVCJSONParser)({ context: ctx, httpClient: this.httpClient }));
        console.log("Registered JWTVCJSONParser...");
        const pkResolverEngine = (0, PublicKeyResolverEngine_1.PublicKeyResolverEngine)();
        const openid4vcRendering = (0, CustomCredentialSvg_1.CustomCredentialSvg)({ httpClient: this.httpClient });
        const credentialRendering = (0, rendering_1.CredentialRenderingService)();
        return {
            credentialParsingEngine,
            msoMdocVerifier: (0, MsoMdocVerifier_1.MsoMdocVerifier)({ context: ctx, pkResolverEngine: pkResolverEngine }),
            sdJwtVerifier: (0, SDJWTVCVerifier_1.SDJWTVCVerifier)({ context: ctx, pkResolverEngine: pkResolverEngine, httpClient: this.httpClient }),
            jwtVcJsonVerifier: (0, JWTVCJSONVerifier_1.JWTVCJSONVerifier)({ context: ctx, pkResolverEngine: pkResolverEngine, httpClient: this.httpClient }),
            openid4vcRendering,
            credentialRendering,
        };
    }
    async generateAuthorizationRequestURL(presentationRequest, sessionId, responseUri, baseUri, privateKeyPem, x5c, responseMode, callbackEndpoint) {
        console.log("Presentation Request: Session id used for authz req ", sessionId);
        const nonce = (0, crypto_1.randomUUID)();
        const state = sessionId;
        const client_id = new URL(responseUri).hostname;
        const [rsaImportedPrivateKey, rpEphemeralKeypair] = await Promise.all([
            (0, jose_1.importPKCS8)(privateKeyPem, 'ES256'),
            (0, jose_1.generateKeyPair)('ECDH-ES')
        ]);
        const [exportedEphPub, exportedEphPriv] = await Promise.all([
            (0, jose_1.exportJWK)(rpEphemeralKeypair.publicKey),
            (0, jose_1.exportJWK)(rpEphemeralKeypair.privateKey)
        ]);
        exportedEphPub.kid = (0, util_1.generateRandomIdentifier)(8);
        exportedEphPriv.kid = exportedEphPub.kid;
        exportedEphPub.use = 'enc';
        let transactionDataObject = [];
        if (presentationRequest?.dcql_query?.credentials) {
            transactionDataObject = await Promise.all(presentationRequest?.dcql_query?.credentials
                .filter((cred) => cred._transaction_data_type !== undefined)
                .map(async (cred) => {
                if (!cred._transaction_data_type) {
                    return null;
                }
                const txData = (0, transactionData_1.TransactionData)(cred._transaction_data_type);
                if (!txData) {
                    return null;
                }
                return await txData
                    .generateTransactionDataRequestObject(cred.id);
            }));
        }
        transactionDataObject = transactionDataObject.filter((td) => td !== null);
        const signedRequestObject = await new jose_1.SignJWT({
            response_uri: responseUri,
            aud: "https://self-issued.me/v2",
            iss: new URL(responseUri).hostname,
            client_id: "x509_san_dns:" + client_id,
            response_type: "vp_token",
            response_mode: responseMode,
            state: state,
            nonce: nonce,
            dcql_query: presentationRequest?.dcql_query?.credentials ? (0, serializeDcqlQuery_1.serializeDcqlQuery)(JSON.parse(JSON.stringify(presentationRequest.dcql_query))) : null,
            client_metadata: {
                "jwks": {
                    "keys": [
                        exportedEphPub
                    ]
                },
                "authorization_encrypted_response_alg": "ECDH-ES",
                "authorization_encrypted_response_enc": "A256GCM",
                "vp_formats": {
                    "vc+sd-jwt": {
                        "sd-jwt_alg_values": [
                            "ES256",
                        ],
                        "kb-jwt_alg_values": [
                            "ES256",
                        ]
                    },
                    "dc+sd-jwt": {
                        "sd-jwt_alg_values": [
                            "ES256",
                        ],
                        "kb-jwt_alg_values": [
                            "ES256",
                        ]
                    },
                    "mso_mdoc": {
                        "alg": ["ES256"]
                    },
                    "jwt_vc_json": {
                        "alg_values_supported": ["ES256"]
                    }
                }
            },
            transaction_data: transactionDataObject.length > 0 ? transactionDataObject : undefined
        })
            .setIssuedAt()
            .setProtectedHeader({
            alg: 'ES256',
            x5c: x5c,
            typ: 'oauth-authz-req+jwt',
        })
            .sign(rsaImportedPrivateKey);
        const redirectUri = "openid4vp://cb";
        const newRpState = {
            session_id: sessionId,
            is_cross_device: true,
            signed_request: signedRequestObject,
            state,
            nonce,
            callback_endpoint: callbackEndpoint ?? null,
            audience: `x509_san_dns:${client_id}`,
            presentation_request_id: presentationRequest.id ??
                presentationRequest.dcql_query?.credentials?.[0]?.id,
            presentation_definition: null,
            dcql_query: presentationRequest?.dcql_query ?? null,
            rp_eph_kid: exportedEphPub.kid ?? "",
            rp_eph_pub: exportedEphPub,
            rp_eph_priv: exportedEphPriv,
            apv_jarm_encrypted_response_header: null,
            apu_jarm_encrypted_response_header: null,
            encrypted_response: null,
            vp_token: null,
            presentation_submission: null,
            response_code: null,
            claims: null,
            completed: null,
            presentation_during_issuance_session: null,
            date_created: Date.now(),
        };
        await this.saveRPState(sessionId, newRpState);
        await this.rpStateKV.set("key:" + exportedEphPub.kid, sessionId);
        // await this.rpStateRepository.save(newRpState);
        const requestUri = baseUri + "/verification/request-object?id=" + state;
        const redirectParameters = {
            client_id: "x509_san_dns:" + client_id,
            request_uri: requestUri
        };
        const searchParams = new URLSearchParams(redirectParameters);
        const authorizationRequestURL = new URL(redirectUri + "?" + searchParams.toString()); // must be openid4vp://cb
        console.log("AUTHZ REQ = ", authorizationRequestURL);
        return { url: authorizationRequestURL, stateId: state, rpState: newRpState };
    }
    async saveRPState(sessionId, state) {
        await this.rpStateKV.set(`rpstate:${sessionId}`, state);
    }
    async saveResponseCodeMapping(responseCode, sessionId) {
        await this.rpStateKV.set(`response_code:${responseCode}`, sessionId);
    }
    async validateDcqlVpToken(vp_token_list, dcql_query, rpState) {
        const presentationClaims = {};
        const ce = await this.initializeCredentialEngine();
        const messages = {};
        for (const descriptor of dcql_query.credentials) {
            const vpEntry = vp_token_list[descriptor.id];
            const vp = Array.isArray(vpEntry) ? vpEntry[0] : null;
            if (!vp) {
                return { error: new Error(`Missing VP for descriptor ${descriptor.id}`) };
            }
            try {
                // detect format: SD-JWT (has ~), JWT_VC_JSON (3-part JWT, no ~), or mdoc (CBOR-encoded)
                if (typeof vp === 'string' && vp.includes('~')) {
                    // ========== SD-JWT ==========
                    try {
                        const [kbjwt] = vp.split('~').reverse();
                        const [_kbjwtEncodedHeader, kbjwtEncodedPayload, _kbjwtSig] = kbjwt.split('.');
                        const kbjwtPayload = JSON.parse(decoder.decode((0, util_2.fromBase64Url)(kbjwtEncodedPayload)));
                        if (Object.keys(kbjwtPayload).includes('transaction_data_hashes') && descriptor._transaction_data_type !== undefined) {
                            const txData = (0, transactionData_1.TransactionData)(descriptor._transaction_data_type);
                            if (!txData) {
                                return { error: new Error("specific transaction_data not supported error") };
                            }
                            const { status, message } = await txData.validateTransactionDataResponse(descriptor.id, {
                                transaction_data_hashes: kbjwtPayload.transaction_data_hashes,
                                transaction_data_hashes_alg: kbjwtPayload.transaction_data_hashes_alg
                            });
                            messages[descriptor.id] = [message];
                            if (!status) {
                                return { error: new Error("transaction_data validation error") };
                            }
                        }
                        else if (descriptor._transaction_data_type !== undefined) {
                            return { error: new Error("transaction_data_hashes is missing from transaction data response") };
                        }
                    }
                    catch (e) {
                        console.error(e);
                        return { error: new Error("transaction_data validation error") };
                    }
                    const verificationResult = await ce.sdJwtVerifier.verify({
                        rawCredential: vp,
                        opts: {
                            expectedAudience: rpState.audience,
                            expectedNonce: rpState.nonce,
                        },
                    });
                    if (!verificationResult.success) {
                        return { error: new Error(`SD-JWT verification failed for ${descriptor.id}: ${verificationResult.error}`) };
                    }
                    const parseResult = await ce.credentialParsingEngine.parse({ rawCredential: vp });
                    if (!parseResult.success) {
                        return { error: new Error(`Parsing SD-JWT failed for ${descriptor.id}: ${parseResult.error}`) };
                    }
                    const signedClaims = parseResult.value.signedClaims;
                    const parsedFormat = parseResult.value.metadata.credential.format;
                    const shaped = {
                        vct: signedClaims.vct,
                        credential_format: parsedFormat === types_1.VerifiableCredentialFormat.VC_SDJWT
                            ? types_1.VerifiableCredentialFormat.VC_SDJWT
                            : types_1.VerifiableCredentialFormat.DC_SDJWT,
                        claims: signedClaims,
                        cryptographic_holder_binding: true
                    };
                    const dcqlResult = dcql_1.DcqlPresentationResult.fromDcqlPresentation(
                    /* @ts-ignore */
                    { [descriptor.id]: [shaped] }, { dcqlQuery: dcql_query });
                    if (!dcqlResult.credential_matches[descriptor.id]?.success) {
                        return { error: new Error(`DCQL validation failed for ${descriptor.id}`) };
                    }
                    const output = dcqlResult.credential_matches[descriptor.id].valid_credentials?.[0].meta.output;
                    if (output.credential_format === types_1.VerifiableCredentialFormat.VC_SDJWT ||
                        output.credential_format === types_1.VerifiableCredentialFormat.DC_SDJWT) {
                        const claims = dcqlResult.credential_matches[descriptor.id].valid_credentials?.[0]?.claims;
                        const dcqlOut = claims?.valid_claim_sets?.[0]?.output;
                        const signedClaims = parseResult.value.signedClaims;
                        const requestedAll = descriptor?.claims == null;
                        // Get all claims if no specific claims were requested
                        const source = requestedAll
                            ? signedClaims
                            : (dcqlOut && Object.keys(dcqlOut).length > 0 ? dcqlOut : signedClaims);
                        const filteredSource = Object.fromEntries(Object.entries(source).filter(([k]) => !RESERVED_SDJWT_TOPLEVEL.has(k) && !k.startsWith('_')));
                        presentationClaims[descriptor.id] = Object.entries(filteredSource).map(([key, value]) => ({
                            key,
                            name: key,
                            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                        }));
                    }
                    else {
                        return { error: new Error(`Unexpected credential_format for descriptor ${descriptor.id}`) };
                    }
                }
                else if (typeof vp === 'string' && vp.split('.').length === 3) {
                    // ========== JWT_VC_JSON (3-part JWT without ~) ==========
                    const verificationResult = await ce.jwtVcJsonVerifier.verify({
                        rawCredential: vp,
                        opts: {
                            expectedAudience: rpState.audience,
                            expectedNonce: rpState.nonce,
                        },
                    });
                    if (!verificationResult.success) {
                        return { error: new Error(`JWT_VC_JSON verification failed for ${descriptor.id}: ${verificationResult.error}`) };
                    }
                    const parseResult = await ce.credentialParsingEngine.parse({ rawCredential: vp });
                    if (!parseResult.success) {
                        return { error: new Error(`Parsing JWT_VC_JSON failed for ${descriptor.id}: ${parseResult.error}`) };
                    }
                    const signedClaims = parseResult.value.signedClaims;
                    const vcType = 'type' in parseResult.value.metadata.credential
                        ? parseResult.value.metadata.credential.type
                        : [];
                    const shaped = {
                        credential_format: types_1.VerifiableCredentialFormat.JWT_VC_JSON,
                        type: vcType,
                        claims: signedClaims,
                        cryptographic_holder_binding: true
                    };
                    const dcqlResult = dcql_1.DcqlPresentationResult.fromDcqlPresentation(
                    /* @ts-ignore */
                    { [descriptor.id]: [shaped] }, { dcqlQuery: dcql_query });
                    if (!dcqlResult.credential_matches[descriptor.id]?.success) {
                        return { error: new Error(`DCQL validation failed for JWT_VC_JSON descriptor ${descriptor.id}`) };
                    }
                    const output = (dcqlResult.credential_matches[descriptor.id].valid_credentials?.[0].meta).output;
                    if (output.credential_format === types_1.VerifiableCredentialFormat.JWT_VC_JSON) {
                        const requestedAll = descriptor?.claims == null;
                        const vcClaims = signedClaims.vc?.credentialSubject;
                        const source = requestedAll
                            ? (vcClaims ?? signedClaims)
                            : (vcClaims ?? signedClaims);
                        presentationClaims[descriptor.id] = Object.entries(source).map(([key, value]) => ({
                            key,
                            name: key,
                            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                        }));
                    }
                    else {
                        return { error: new Error(`Unexpected credential_format for JWT_VC_JSON descriptor ${descriptor.id}`) };
                    }
                }
                else {
                    // ========== mdoc ==========
                    const verificationResult = await ce.msoMdocVerifier.verify({
                        rawCredential: vp,
                        opts: {
                            expectedAudience: rpState.audience,
                            expectedNonce: rpState.nonce,
                            holderNonce: rpState.apu_jarm_encrypted_response_header
                                ? decoder.decode((0, util_2.fromBase64Url)(rpState.apu_jarm_encrypted_response_header))
                                : undefined,
                            responseUri: this.options.redirectUri,
                        },
                    });
                    if (!verificationResult.success) {
                        return { error: new Error(`mDoc verification failed for ${descriptor.id}: ${verificationResult.error}`) };
                    }
                    const parseResult = await ce.credentialParsingEngine.parse({ rawCredential: vp });
                    if (!parseResult.success) {
                        return { error: new Error(`Parsing mDoc failed for ${descriptor.id}: ${parseResult.error}`) };
                    }
                    const signedClaims = parseResult.value.signedClaims;
                    const shaped = {
                        credential_format: types_1.VerifiableCredentialFormat.MSO_MDOC,
                        doctype: descriptor.meta?.doctype_value,
                        cryptographic_holder_binding: true,
                        namespaces: signedClaims
                    };
                    const dcqlResult = dcql_1.DcqlPresentationResult.fromDcqlPresentation(
                    /* @ts-ignore */
                    { [descriptor.id]: [shaped] }, { dcqlQuery: dcql_query });
                    if (!dcqlResult.credential_matches[descriptor.id]?.success) {
                        return { error: new Error(`DCQL validation failed for mdoc descriptor ${descriptor.id}`) };
                    }
                    const output = dcqlResult.credential_matches[descriptor.id].valid_credentials?.[0].meta.output;
                    if (output.credential_format === types_1.VerifiableCredentialFormat.MSO_MDOC) {
                        const claimsObject = dcqlResult.credential_matches[descriptor.id].valid_credentials?.[0].claims;
                        if (!claimsObject) {
                            return { error: new Error(`No claims found in mdoc for doctype ${descriptor.meta?.doctype_value}`) };
                        }
                        presentationClaims[descriptor.id] = Object.entries(claimsObject.valid_claim_sets[0].output[descriptor.meta?.doctype_value]).map(([key, value]) => ({
                            key,
                            name: key,
                            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                        }));
                    }
                    else {
                        return { error: new Error(`Unexpected mdoc credential_format in output for descriptor ${descriptor.id}`) };
                    }
                }
            }
            catch (e) {
                console.error(`Error processing descriptor ${descriptor.id}:`, e);
                return { error: new Error(`Internal error verifying or parsing VP for descriptor ${descriptor.id}`) };
            }
        }
        return { presentationClaims, messages };
    }
    async getPresentationBySessionId(sessionId, cleanupSession = false) {
        if (!sessionId) {
            console.error("getPresentationBySessionId: Invalid sessionId");
            const error = new Error("getPresentationBySessionId: Invalid sessionId");
            return { status: false, error };
        }
        const rpState = await this.rpStateKV.get(`rpstate:${sessionId}`);
        if (!rpState) {
            console.error("Couldn't get rpState with the session_id " + sessionId);
            const error = new Error("Couldn't get rpState with the session_id " + sessionId);
            return { status: false, error };
        }
        if (!rpState.vp_token) {
            console.error("Presentation has not been sent. session_id " + sessionId);
            const error = new Error("Presentation has not been sent. session_id " + sessionId);
            return { status: false, error };
        }
        const vp_token = JSON.parse(decoder.decode((0, util_2.fromBase64Url)(rpState.vp_token)));
        let presentationClaims;
        let presentationInfo = {};
        let error;
        if (rpState.dcql_query) {
            const result = await this.validateDcqlVpToken(vp_token, rpState.dcql_query, rpState);
            presentationClaims = result.presentationClaims;
            presentationInfo = result.messages ? result.messages : {};
            error = result.error;
        }
        if (error) {
            console.error(error);
            return { status: false, error };
        }
        if (cleanupSession) {
            const responseCode = rpState.response_code;
            rpState.state = "";
            rpState.session_id = ""; // invalidate session id
            rpState.response_code = "";
            // await this.rpStateRepository.save(rpState);
            this.saveRPState(sessionId, rpState);
            if (responseCode) {
                await this.rpStateKV.delete(`response_code:${responseCode}`);
            }
        }
        if (!rpState.claims && presentationClaims) {
            rpState.claims = presentationClaims;
            // await this.rpStateRepository.save(rpState);
            await this.saveRPState(sessionId, rpState);
        }
        if (rpState) {
            return {
                status: true,
                rpState: rpState,
                presentationInfo,
                presentations: Object.values(vp_token).flatMap((v) => v)
            };
        }
        const unkownErr = new Error("Uknown error");
        return { status: false, error: unkownErr };
    }
    async getRPStateByResponseCode(responseCode) {
        const sessionId = await this.rpStateKV.get(`response_code:${responseCode}`);
        if (!sessionId) {
            console.error("getPresentationByResponseCode: No session id for response code");
            return null;
        }
        const rpState = await this.rpStateKV.get(`rpstate:${sessionId}`);
        if (!rpState) {
            console.error("getPresentationByResponseCode: Missing rpState for session id");
            return null;
        }
        return rpState;
    }
    async getRPStateBySessionId(sessionId) {
        const rpState = await this.rpStateKV.get(`rpstate:${sessionId}`);
        if (!rpState) {
            console.error("getRPStateBySessionId: Missing rpState for session id");
            return null;
        }
        return rpState;
    }
    async getRPStateByKid(kid) {
        const sessionId = await this.rpStateKV.get("key:" + kid);
        if (!sessionId) {
            return null;
        }
        const rpState = await this.rpStateKV.get(`rpstate:${sessionId}`);
        if (!rpState) {
            return null;
        }
        return rpState;
    }
    async handleResponseJARM(response, kid) {
        // get rpstate only to get the private key to decrypt the response
        const rpState = await this.getRPStateByKid(kid);
        if (!rpState) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingRPStateForKid, "responseHandler: Could not retrieve rpState from kid");
        }
        const rp_eph_priv = await (0, jose_1.importJWK)(rpState.rp_eph_priv, 'ECDH-ES');
        const result = await (0, jose_1.compactDecrypt)(response, rp_eph_priv).then((r) => ({ data: r, err: null })).catch((err) => ({ data: null, err: err }));
        if (result.err) {
            const errorDescription = result.err instanceof Error ? result.err.message : String(result.err);
            console.error({ error: "JWE Decryption failure", error_description: result.err });
            console.log("Received JWE headers: ", JSON.parse(decoder.decode((0, util_2.fromBase64Url)(response.split('.')[0]))));
            console.log("Received JWE: ", response);
            //ctx.res.status(500).send(error);
            return (0, core_1.err)(exports.OpenID4VPClientErrors.JWEDecryptionFailure, errorDescription);
        }
        const { protectedHeader, plaintext } = result.data;
        console.log("Protected header = ", protectedHeader);
        const payload = JSON.parse(new TextDecoder().decode(plaintext));
        if (!payload?.state) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingState, "Missing state");
        }
        if (rpState.completed) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.PresentationAlreadyCompleted, "Presentation flow already completed");
        }
        if (!payload.vp_token) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingVpToken, "Encrypted Response: vp_token is missing");
        }
        if (!payload.presentation_submission && !payload.vp_token) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingPresentationSubmissionAndVpToken, "Encrypted Response: presentation_submission and vp_token are missing");
        }
        rpState.response_code = (0, util_2.toBase64Url)(encoder.encode((0, crypto_1.randomUUID)()));
        await this.saveResponseCodeMapping(rpState.response_code, rpState.session_id);
        rpState.encrypted_response = response;
        rpState.presentation_submission = payload.presentation_submission;
        console.log("Encoding....");
        rpState.vp_token = (0, util_2.toBase64Url)(encoder.encode(JSON.stringify(payload.vp_token)));
        rpState.date_created = Date.now();
        rpState.apv_jarm_encrypted_response_header = protectedHeader.apv && typeof protectedHeader.apv == 'string' ? protectedHeader.apv : null;
        rpState.apu_jarm_encrypted_response_header = protectedHeader.apu && typeof protectedHeader.apu == 'string' ? protectedHeader.apu : null;
        rpState.completed = true;
        console.log("Stored rp state = ", rpState);
        //await this.rpStateRepository.save(rpState);
        await this.saveRPState(rpState.session_id, rpState);
        return (0, core_1.ok)(rpState);
    }
    async handleResponseDirectPost(state, vp_token, presentation_submission) {
        if (!state) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingState, "Missing state param");
        }
        if (!vp_token) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingVpToken, "Missing vp_token param");
        }
        const rpState = await this.rpStateKV.get(`rpstate:${state}`);
        if (!rpState) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingRPState, "Couldn't get rp state with state");
        }
        if (rpState.completed) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.PresentationAlreadyCompleted, "Presentation flow already completed");
        }
        rpState.response_code = (0, util_2.toBase64Url)(encoder.encode((0, crypto_1.randomUUID)()));
        await this.saveResponseCodeMapping(rpState.response_code, rpState.session_id);
        rpState.presentation_submission = presentation_submission;
        rpState.vp_token = (0, util_2.toBase64Url)(encoder.encode(JSON.stringify(vp_token)));
        rpState.date_created = Date.now();
        rpState.completed = true;
        await this.saveRPState(rpState.session_id, rpState);
        return (0, core_1.ok)(rpState);
    }
    async getSignedRequestObject(sessionId) {
        const rpState = await this.getRPStateBySessionId(sessionId);
        if (!rpState) {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.MissingRPState, "rpState state could not be fetched with this id");
        }
        if (rpState.signed_request === "") {
            return (0, core_1.err)(exports.OpenID4VPClientErrors.SignedRequestObjectInvalidated, "rpState state signed request object has been invalidated");
        }
        const signedRequest = rpState.signed_request;
        rpState.signed_request = "";
        await this.saveRPState(sessionId, rpState);
        return (0, core_1.ok)(signedRequest);
    }
}
exports.OpenID4VPClientAPI = OpenID4VPClientAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3BlbklENFZQQ2xpZW50QVBJLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Byb3RvY29scy9vcGVuaWQ0dnAvT3BlbklENFZQQ2xpZW50QVBJLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFDQUEyRDtBQUMzRCwyQ0FBNEQ7QUFDNUQsMEVBQXVFO0FBQ3ZFLDBFQUF1RTtBQUN2RSw4RUFBMkU7QUFDM0UsZ0ZBQTZFO0FBQzdFLGdGQUE2RTtBQUM3RSxvRkFBaUY7QUFDakYsNkVBQTBFO0FBRTFFLHVEQUFvRDtBQUNwRCwyRUFBd0U7QUFDeEUsK0NBQTZEO0FBQzdELHVDQUF5RDtBQUN6RCwyQ0FBOEQ7QUFDOUQsdURBQW9EO0FBRXBELCtCQUE4QztBQUM5QyxtQ0FBb0M7QUFDcEMsK0JBQXlIO0FBQ3pILHVFQUFvRTtBQUV2RCxRQUFBLHFCQUFxQixHQUFHO0lBQ3BDLG9CQUFvQixFQUFFLHlCQUF5QjtJQUMvQyxjQUFjLEVBQUUsaUJBQWlCO0lBQ2pDLG9CQUFvQixFQUFFLHdCQUF3QjtJQUM5QyxZQUFZLEVBQUUsZUFBZTtJQUM3Qiw0QkFBNEIsRUFBRSxnQ0FBZ0M7SUFDOUQsY0FBYyxFQUFFLGtCQUFrQjtJQUNsQyx1Q0FBdUMsRUFBRSw4Q0FBOEM7SUFDdkYsOEJBQThCLEVBQUUsbUNBQW1DO0NBQzFELENBQUM7QUFJWCxNQUFNLHVCQUF1QixHQUFHLElBQUksR0FBRyxDQUFDO0lBQ3ZDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSztJQUM3RCx5QkFBeUIsRUFBRSw2QkFBNkIsRUFBRSxlQUFlO0NBQ3pFLENBQUMsQ0FBQztBQUNILE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDbEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUVsQyxNQUFhLGtC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