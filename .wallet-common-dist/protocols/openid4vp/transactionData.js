"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionData = exports.QCRequestTransactionData = exports.QESAuthorizationTransactionData = exports.TransactionDataResponse = exports.TransactionDataRequestObject = void 0;
exports.parseTransactionData = parseTransactionData;
exports.convertTransactionDataB65uToHash = convertTransactionDataB65uToHash;
const jose_1 = require("jose");
const node_crypto_1 = __importDefault(require("node:crypto"));
const zod_1 = require("zod");
const util_1 = require("../../utils/util");
// Accept both string "sha-256" and array ["sha-256"] for interoperability
// Some implementations send array per newer spec drafts, others send string
const sha256Flexible = zod_1.z.union([
    zod_1.z.literal("sha-256"),
    zod_1.z.array(zod_1.z.literal("sha-256")).min(1),
]);
// Using default Zod behavior (no .strict()) to accept but strip unknown keys
// This allows interoperability without propagating untrusted fields
exports.TransactionDataRequestObject = zod_1.z.discriminatedUnion("type", [
    zod_1.z.object({
        type: zod_1.z.literal("urn:wwwallet:example_transaction_data_type"),
        credential_ids: zod_1.z.array(zod_1.z.string()),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("qes_authorization"),
        credential_ids: zod_1.z.array(zod_1.z.string()),
        signatureQualifier: zod_1.z.string().optional(),
        transaction_data_hashes_alg: sha256Flexible,
        documentDigests: zod_1.z.array(zod_1.z.object({
            hash: zod_1.z.string().optional(),
            label: zod_1.z.string(),
            hashAlgorithmOID: zod_1.z.string().optional(),
        })),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("qcert_creation_acceptance"),
        credential_ids: zod_1.z.array(zod_1.z.string()),
        QC_terms_conditions_uri: zod_1.z.string().optional(),
        QC_hash: zod_1.z.string().optional(),
        QC_hashAlgorithmOID: zod_1.z.string().optional(),
        transaction_data_hashes_alg: sha256Flexible,
    }),
    zod_1.z.object({
        type: zod_1.z.literal("https://cloudsignatureconsortium.org/2025/qes"),
        credential_ids: zod_1.z.array(zod_1.z.string()),
        numSignatures: zod_1.z.number().optional(),
        signatureQualifier: zod_1.z.string().optional(),
        transaction_data_hashes_alg: sha256Flexible,
        documentDigests: zod_1.z.array(zod_1.z.object({
            hash: zod_1.z.string().optional(),
            label: zod_1.z.string(),
            hashType: zod_1.z.string().optional(),
        })),
        processID: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal("https://cloudsignatureconsortium.org/2025/qc-request"),
        credential_ids: zod_1.z.array(zod_1.z.string()),
        QC_terms_conditions_uri: zod_1.z.string().optional(),
        QC_hash: zod_1.z.string().optional(),
        QC_hashAlgorithmOID: zod_1.z.string().optional(),
        transaction_data_hashes_alg: sha256Flexible,
    }),
]);
function parseTransactionData(transaction_data, dcql_query) {
    try {
        let validCredentialIds = null;
        if (dcql_query?.credentials instanceof Array) {
            validCredentialIds = dcql_query.credentials.map((credential) => credential.id);
        }
        const parsedTransactionData = transaction_data.map((td) => {
            const parsed = exports.TransactionDataRequestObject.parse(JSON.parse(new TextDecoder().decode((0, util_1.fromBase64Url)(td))));
            return {
                transaction_data_b64u: td,
                parsed,
            };
        });
        for (const td of parsedTransactionData) {
            if (td.parsed.credential_ids && validCredentialIds) {
                for (const cred_id of td.parsed.credential_ids) {
                    if (!validCredentialIds.includes(cred_id)) {
                        throw new Error("Transaction data includes invalid credential ids that don't exist in the definition");
                    }
                }
            }
        }
        return parsedTransactionData;
    }
    catch (e) {
        console.error(e);
        return null;
    }
}
async function convertTransactionDataB65uToHash(x) {
    const data = (0, util_1.fromBase64Url)(x);
    const webcrypto = globalThis.crypto?.subtle ?? node_crypto_1.default.subtle;
    const digest = await webcrypto.digest('SHA-256', new Uint8Array(data));
    return (0, util_1.toBase64Url)(digest);
}
const TransactionDataResponse = ({ descriptor_id, dcql_query }) => {
    return {
        generateTransactionDataResponse: async (transaction_data) => {
            const parsedTd = parseTransactionData(transaction_data, dcql_query);
            if (parsedTd === null) {
                return [null, new Error("invalid_transaction_data")];
            }
            for (const td of parsedTd) {
                if (td.parsed.credential_ids.includes(descriptor_id)) {
                    return [{
                            transaction_data_hashes: [await convertTransactionDataB65uToHash(td.transaction_data_b64u)],
                            transaction_data_hashes_alg: ["sha-256"],
                        }, null];
                }
            }
            return [null, new Error("Couldn't generate transaction data response")];
        },
    };
};
exports.TransactionDataResponse = TransactionDataResponse;
const QESAuthorizationTransactionData = () => {
    const webcrypto = node_crypto_1.default.subtle;
    const generateTransactionDataRequestObject = async (descriptorId) => {
        return jose_1.base64url.encode(JSON.stringify({
            type: 'https://cloudsignatureconsortium.org/2025/qes',
            credential_ids: [descriptorId],
            signatureQualifier: "eu_eidas_qes",
            transaction_data_hashes_alg: "sha-256",
            numSignatures: 1,
            processID: "random-process-id",
            documentDigests: [
                {
                    hash: "some-hash-of-the-document",
                    label: "Personal Loan Agreement",
                    hashType: "sodr"
                }
            ],
        }));
    };
    return {
        generateTransactionDataRequestObject,
        validateTransactionDataResponse: async (exprectedDescriptorId, params) => {
            const expectedObjectB64U = await generateTransactionDataRequestObject(exprectedDescriptorId);
            const expectedObjectDecoded = (0, util_1.fromBase64Url)(expectedObjectB64U);
            for (const hashB64U of params.transaction_data_hashes) {
                if (!params.transaction_data_hashes_alg || params.transaction_data_hashes_alg.includes('sha-256')) { // sha256 case
                    const calculatedHashOfExpectedObject = (0, util_1.toBase64Url)(await webcrypto.digest('SHA-256', expectedObjectDecoded));
                    console.log("calculatedHash = ", calculatedHashOfExpectedObject);
                    console.log("hashB64U = ", hashB64U);
                    if (calculatedHashOfExpectedObject === hashB64U) {
                        return { status: true, message: "User authorized the QTSP to create QES for the document \"Personal Loan Agreement\"" };
                    }
                }
            }
            return { status: true, message: "" };
        }
    };
};
exports.QESAuthorizationTransactionData = QESAuthorizationTransactionData;
const QCRequestTransactionData = () => {
    const webcrypto = node_crypto_1.default.subtle;
    const generateTransactionDataRequestObject = async (descriptorId) => {
        return jose_1.base64url.encode(JSON.stringify({
            type: 'https://cloudsignatureconsortium.org/2025/qc-request',
            credential_ids: [descriptorId],
            QC_terms_conditions_uri: "https://qtsp.example.com/policies/terms_and_conditions.pdf",
            QC_hash: "ohxKcClPp/J1dI1iv5x519BpjduGZC794x4ABFeb+Ds=",
            QC_hashAlgorithmOID: "2.16.840.1.101.3.4.2.1",
            transaction_data_hashes_alg: "sha-256"
        }));
    };
    return {
        generateTransactionDataRequestObject,
        validateTransactionDataResponse: async (exprectedDescriptorId, params) => {
            const expectedObjectB64U = await generateTransactionDataRequestObject(exprectedDescriptorId);
            const expectedObjectDecoded = (0, util_1.fromBase64Url)(expectedObjectB64U);
            for (const hashB64U of params.transaction_data_hashes) {
                if (!params.transaction_data_hashes_alg || params.transaction_data_hashes_alg.includes('sha-256')) { // sha256 case
                    const calculatedHashOfExpectedObject = (0, util_1.toBase64Url)(await webcrypto.digest('SHA-256', expectedObjectDecoded));
                    console.log("calculatedHash = ", calculatedHashOfExpectedObject);
                    console.log("hashB64U = ", hashB64U);
                    if (calculatedHashOfExpectedObject === hashB64U) {
                        return { status: true, message: "User attested the creation of Qualified Certificates" };
                    }
                }
            }
            return { status: false, message: "" };
        }
    };
};
exports.QCRequestTransactionData = QCRequestTransactionData;
const TransactionData = (transactionDataType) => {
    switch (transactionDataType) {
        case "https://cloudsignatureconsortium.org/2025/qes":
            return (0, exports.QESAuthorizationTransactionData)();
        case "https://cloudsignatureconsortium.org/2025/qc-request":
            return (0, exports.QCRequestTransactionData)();
        default:
            return null;
    }
};
exports.TransactionData = TransactionData;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNhY3Rpb25EYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Byb3RvY29scy9vcGVuaWQ0dnAvdHJhbnNhY3Rpb25EYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXlFQSxvREFxQ0M7QUFFRCw0RUFLQztBQXJIRCwrQkFBaUM7QUFDakMsOERBQWlDO0FBQ2pDLDZCQUF3QjtBQUN4QiwyQ0FBOEQ7QUFHOUQsMEVBQTBFO0FBQzFFLDRFQUE0RTtBQUM1RSxNQUFNLGNBQWMsR0FBRyxPQUFDLENBQUMsS0FBSyxDQUFDO0lBQzlCLE9BQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO0lBQ3BCLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDcEMsQ0FBQyxDQUFDO0FBRUgsNkVBQTZFO0FBQzdFLG9FQUFvRTtBQUN2RCxRQUFBLDRCQUE0QixHQUFHLE9BQUMsQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUU7SUFDeEUsT0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNSLElBQUksRUFBRSxPQUFDLENBQUMsT0FBTyxDQUFDLDRDQUE0QyxDQUFDO1FBQzdELGNBQWMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztLQUNuQyxDQUFDO0lBRUYsT0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNSLElBQUksRUFBRSxPQUFDLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1FBQ3BDLGNBQWMsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNuQyxrQkFBa0IsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO1FBQ3pDLDJCQUEyQixFQUFFLGNBQWM7UUFDM0MsZUFBZSxFQUFFLE9BQUMsQ0FBQyxLQUFLLENB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