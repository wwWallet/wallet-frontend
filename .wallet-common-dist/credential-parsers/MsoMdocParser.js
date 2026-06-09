"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsoMdocParser = MsoMdocParser;
const error_1 = require("../error");
const mdl_1 = require("@auth0/mdl");
const util_1 = require("../utils/util");
const types_1 = require("../types");
const cbor_1 = require("@auth0/mdl/lib/cbor");
const CustomCredentialSvg_1 = require("../functions/CustomCredentialSvg");
const getIssuerMetadata_1 = require("../utils/getIssuerMetadata");
const convertOpenid4vciToSdjwtvcClaims_1 = require("../functions/convertOpenid4vciToSdjwtvcClaims");
const dataUriResolver_1 = require("../resolvers/dataUriResolver");
const friendlyNameResolver_1 = require("../resolvers/friendlyNameResolver");
function MsoMdocParser(args) {
    function canParseMsoMdoc(raw) {
        if (typeof raw !== "string")
            return false;
        const bytes = (0, util_1.fromBase64Url)(raw);
        if ((bytes[0] === 0xA2 && bytes[1] === 0x6A) ||
            (bytes[0] === 0xB9 && bytes[1] === 0x00)) {
            return true;
        }
        return false;
    }
    function extractValidityInfo(issuerSigned) {
        return issuerSigned.issuerAuth.decodedPayload.validityInfo;
    }
    function collectAllAttrValues(parsedDocument) {
        return parsedDocument.issuerSignedNameSpaces.reduce((acc, ns) => {
            acc[ns] = parsedDocument.getIssuerNameSpace(ns);
            return acc;
        }, {});
    }
    async function fetchIssuerMetadataAndDocs(credentialIssuer) {
        let issuerMetadata = null;
        let TypeMetadata = {};
        try {
            if (credentialIssuer?.credentialIssuerIdentifier) {
                const { metadata } = await (0, getIssuerMetadata_1.getIssuerMetadata)(args.httpClient, credentialIssuer.credentialIssuerIdentifier, []);
                issuerMetadata = metadata ?? null;
                const issuerClaimsArray = credentialIssuer?.credentialConfigurationId
                    ? issuerMetadata?.credential_configurations_supported?.[credentialIssuer.credentialConfigurationId]?.credential_metadata?.claims
                    : undefined;
                const convertedClaims = issuerClaimsArray ? (0, convertOpenid4vciToSdjwtvcClaims_1.convertOpenid4vciToSdjwtvcClaims)(issuerClaimsArray) : undefined;
                if (convertedClaims?.length) {
                    TypeMetadata = { claims: convertedClaims };
                }
            }
        }
        catch (e) {
            console.warn("Issuer metadata unavailable or invalid:", e);
        }
        return { issuerMetadata, TypeMetadata };
    }
    function toParsedCredential(parsedDocument, signedClaims, TypeMetadata, friendlyName, dataUri) {
        return {
            metadata: {
                credential: {
                    format: types_1.VerifiableCredentialFormat.MSO_MDOC,
                    doctype: parsedDocument.docType,
                    TypeMetadata,
                    image: { dataUri },
                    name: friendlyName
                },
                issuer: {
                    id: parsedDocument.issuerSigned.issuerAuth.certificate.issuer,
                    name: parsedDocument.issuerSigned.issuerAuth.certificate.issuer
                }
            },
            signedClaims: { ...signedClaims },
            validityInfo: { ...extractValidityInfo(parsedDocument.issuerSigned) }
        };
    }
    async function deviceResponseParser(rawCredential, credentialIssuer) {
        try {
            const decodedCred = (0, util_1.fromBase64Url)(rawCredential);
            const parsedMDOC = (0, mdl_1.parse)(decodedCred);
            const [parsedDocument] = parsedMDOC.documents;
            const signedClaims = collectAllAttrValues(parsedDocument);
            const renderer = (0, CustomCredentialSvg_1.CustomCredentialSvg)({ httpClient: args.httpClient });
            const { issuerMetadata, TypeMetadata } = await fetchIssuerMetadataAndDocs(credentialIssuer);
            const issuerDisplayArray = credentialIssuer?.credentialConfigurationId
                ? issuerMetadata?.credential_configurations_supported?.[credentialIssuer.credentialConfigurationId]?.credential_metadata?.display
                : undefined;
            const friendlyName = (0, friendlyNameResolver_1.friendlyNameResolver)({
                issuerDisplayArray,
                fallbackName: "mdoc Verifiable Credential",
            });
            const dataUri = (0, dataUriResolver_1.dataUriResolver)({
                httpClient: args.httpClient,
                customRenderer: renderer,
                issuerDisplayArray,
                fallbackName: "mdoc Verifiable Credential",
            });
            return toParsedCredential(parsedDocument, signedClaims, TypeMetadata, friendlyName, dataUri);
        }
        catch {
            return null;
        }
    }
    async function issuerSignedParser(rawCredential, credentialIssuer) {
        try {
            const credentialBytes = (0, util_1.fromBase64Url)(rawCredential);
            const issuerSigned = (0, cbor_1.cborDecode)(credentialBytes);
            const [header, _, payload, sig] = issuerSigned.get('issuerAuth');
            const decodedIssuerAuthPayload = (0, cbor_1.cborDecode)(payload);
            const docType = decodedIssuerAuthPayload.data.get('docType');
            const m = {
                version: '1.0',
                documents: [new Map([
                        ['docType', docType],
                        ['issuerSigned', issuerSigned]
                    ])],
                status: 0
            };
            const encoded = (0, cbor_1.cborEncode)(m);
            const mdoc = (0, mdl_1.parse)(encoded);
            const [parsedDocument] = mdoc.documents;
            const signedClaims = collectAllAttrValues(parsedDocument);
            const renderer = (0, CustomCredentialSvg_1.CustomCredentialSvg)({ httpClient: args.httpClient });
            const { issuerMetadata, TypeMetadata } = await fetchIssuerMetadataAndDocs(credentialIssuer);
            const issuerDisplayArray = credentialIssuer?.credentialConfigurationId
                ? issuerMetadata?.credential_configurations_supported?.[credentialIssuer.credentialConfigurationId]?.credential_metadata?.display
                : undefined;
            const friendlyName = (0, friendlyNameResolver_1.friendlyNameResolver)({
                issuerDisplayArray,
                fallbackName: "mdoc Verifiable Credential",
            });
            const dataUri = (0, dataUriResolver_1.dataUriResolver)({
                httpClient: args.httpClient,
                customRenderer: renderer,
                issuerDisplayArray,
                fallbackName: "mdoc Verifiable Credential",
            });
            return toParsedCredential(parsedDocument, signedClaims, TypeMetadata, friendlyName, dataUri);
        }
        catch {
            return null;
        }
    }
    return {
        async parse({ rawCredential, credentialIssuer }) {
            if (!canParseMsoMdoc(rawCredential)) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.UnsupportedFormat,
                };
            }
            const deviceResponseParsingResult = await deviceResponseParser(rawCredential, credentialIssuer ?? null);
            if (deviceResponseParsingResult) {
                return {
                    success: true,
                    value: deviceResponseParsingResult
                };
            }
            const issuerSignedParsingResult = await issuerSignedParser(rawCredential, credentialIssuer ?? null);
            if (issuerSignedParsingResult) {
                return {
                    success: true,
                    value: issuerSignedParsingResult,
                };
            }
            return {
                success: false,
                error: error_1.CredentialParsingError.CouldNotParse,
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXNvTWRvY1BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcmVkZW50aWFsLXBhcnNlcnMvTXNvTWRvY1BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWlCQSxzQ0FxTUM7QUF0TkQsb0NBQWtEO0FBRWxELG9DQUFtRTtBQUNuRSx3Q0FBOEM7QUFDOUMsb0NBQXdJO0FBQ3hJLDhDQUE2RDtBQUU3RCwwRUFBdUU7QUFDdkUsa0VBQStEO0FBQy9ELG9HQUFpRztBQUdqRyxrRUFBK0Q7QUFDL0QsNEVBQXlFO0FBSXpFLFNBQWdCLGFBQWEsQ0FBQyxJQUFrRDtJQUUvRSxTQUFTLGVBQWUsQ0FBQyxHQUFZO1FBRXBDLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtZQUFFLE9BQU8sS0FBSyxDQUFDO1FBRTFDLE1BQU0sS0FBSyxHQUFHLElBQUEsb0JBQWEsRUFBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxJQUNDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDO1lBQ3hDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLEVBQ3ZDLENBQUM7WUFDRixPQUFPLElBQUksQ0FBQztRQUNiLENBQUM7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLG1CQUFtQixDQUFDLFlBQTBCO1FBQ3RELE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDO0lBQzVELENBQUM7SUFFRCxTQUFTLG9CQUFvQixDQUFDLGNBQW9DO1FBQ2pFLE9BQU8sY0FBYyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBMEIsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDeEYsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFH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