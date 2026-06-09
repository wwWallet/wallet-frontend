import { z } from "zod";
import { TransactionDataResponseGenerator, TransactionDataResponseGeneratorParams } from './types';
export declare const TransactionDataRequestObject: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"urn:wwwallet:example_transaction_data_type">;
    credential_ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    type: "urn:wwwallet:example_transaction_data_type";
    credential_ids: string[];
}, {
    type: "urn:wwwallet:example_transaction_data_type";
    credential_ids: string[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"qes_authorization">;
    credential_ids: z.ZodArray<z.ZodString, "many">;
    signatureQualifier: z.ZodOptional<z.ZodString>;
    transaction_data_hashes_alg: z.ZodUnion<[z.ZodLiteral<"sha-256">, z.ZodArray<z.ZodLiteral<"sha-256">, "many">]>;
    documentDigests: z.ZodArray<z.ZodObject<{
        hash: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
        hashAlgorithmOID: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        hash?: string | undefined;
        hashAlgorithmOID?: string | undefined;
    }, {
        label: string;
        hash?: string | undefined;
        hashAlgorithmOID?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "qes_authorization";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    documentDigests: {
        label: string;
        hash?: string | undefined;
        hashAlgorithmOID?: string | undefined;
    }[];
    signatureQualifier?: string | undefined;
}, {
    type: "qes_authorization";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    documentDigests: {
        label: string;
        hash?: string | undefined;
        hashAlgorithmOID?: string | undefined;
    }[];
    signatureQualifier?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"qcert_creation_acceptance">;
    credential_ids: z.ZodArray<z.ZodString, "many">;
    QC_terms_conditions_uri: z.ZodOptional<z.ZodString>;
    QC_hash: z.ZodOptional<z.ZodString>;
    QC_hashAlgorithmOID: z.ZodOptional<z.ZodString>;
    transaction_data_hashes_alg: z.ZodUnion<[z.ZodLiteral<"sha-256">, z.ZodArray<z.ZodLiteral<"sha-256">, "many">]>;
}, "strip", z.ZodTypeAny, {
    type: "qcert_creation_acceptance";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    QC_terms_conditions_uri?: string | undefined;
    QC_hash?: string | undefined;
    QC_hashAlgorithmOID?: string | undefined;
}, {
    type: "qcert_creation_acceptance";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    QC_terms_conditions_uri?: string | undefined;
    QC_hash?: string | undefined;
    QC_hashAlgorithmOID?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"https://cloudsignatureconsortium.org/2025/qes">;
    credential_ids: z.ZodArray<z.ZodString, "many">;
    numSignatures: z.ZodOptional<z.ZodNumber>;
    signatureQualifier: z.ZodOptional<z.ZodString>;
    transaction_data_hashes_alg: z.ZodUnion<[z.ZodLiteral<"sha-256">, z.ZodArray<z.ZodLiteral<"sha-256">, "many">]>;
    documentDigests: z.ZodArray<z.ZodObject<{
        hash: z.ZodOptional<z.ZodString>;
        label: z.ZodString;
        hashType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        hash?: string | undefined;
        hashType?: string | undefined;
    }, {
        label: string;
        hash?: string | undefined;
        hashType?: string | undefined;
    }>, "many">;
    processID: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "https://cloudsignatureconsortium.org/2025/qes";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    documentDigests: {
        label: string;
        hash?: string | undefined;
        hashType?: string | undefined;
    }[];
    signatureQualifier?: string | undefined;
    numSignatures?: number | undefined;
    processID?: string | undefined;
}, {
    type: "https://cloudsignatureconsortium.org/2025/qes";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    documentDigests: {
        label: string;
        hash?: string | undefined;
        hashType?: string | undefined;
    }[];
    signatureQualifier?: string | undefined;
    numSignatures?: number | undefined;
    processID?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"https://cloudsignatureconsortium.org/2025/qc-request">;
    credential_ids: z.ZodArray<z.ZodString, "many">;
    QC_terms_conditions_uri: z.ZodOptional<z.ZodString>;
    QC_hash: z.ZodOptional<z.ZodString>;
    QC_hashAlgorithmOID: z.ZodOptional<z.ZodString>;
    transaction_data_hashes_alg: z.ZodUnion<[z.ZodLiteral<"sha-256">, z.ZodArray<z.ZodLiteral<"sha-256">, "many">]>;
}, "strip", z.ZodTypeAny, {
    type: "https://cloudsignatureconsortium.org/2025/qc-request";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    QC_terms_conditions_uri?: string | undefined;
    QC_hash?: string | undefined;
    QC_hashAlgorithmOID?: string | undefined;
}, {
    type: "https://cloudsignatureconsortium.org/2025/qc-request";
    credential_ids: string[];
    transaction_data_hashes_alg: "sha-256" | "sha-256"[];
    QC_terms_conditions_uri?: string | undefined;
    QC_hash?: string | undefined;
    QC_hashAlgorithmOID?: string | undefined;
}>]>;
export type TransactionDataRequest = z.infer<typeof TransactionDataRequestObject>;
export type ParsedTransactionDataType = {
    transaction_data_b64u: string;
    parsed: TransactionDataRequest;
};
export declare function parseTransactionData(transaction_data: string[], dcql_query: Record<string, unknown>): ParsedTransactionDataType[] | null;
export declare function convertTransactionDataB65uToHash(x: string): Promise<string>;
export declare const TransactionDataResponse: ({ descriptor_id, dcql_query }: TransactionDataResponseGeneratorParams) => TransactionDataResponseGenerator;
export declare const QESAuthorizationTransactionData: () => {
    generateTransactionDataRequestObject: (descriptorId: string) => Promise<string>;
    validateTransactionDataResponse: (exprectedDescriptorId: string, params: {
        transaction_data_hashes: string[];
        transaction_data_hashes_alg?: string[];
    }) => Promise<{
        status: boolean;
        message: string;
    }>;
};
export declare const QCRequestTransactionData: () => {
    generateTransactionDataRequestObject: (descriptorId: string) => Promise<string>;
    validateTransactionDataResponse: (exprectedDescriptorId: string, params: {
        transaction_data_hashes: string[];
        transaction_data_hashes_alg?: string[];
    }) => Promise<{
        status: boolean;
        message: string;
    }>;
};
export declare const TransactionData: (transactionDataType: "https://cloudsignatureconsortium.org/2025/qes" | "https://cloudsignatureconsortium.org/2025/qc-request") => {
    generateTransactionDataRequestObject: (descriptorId: string) => Promise<string>;
    validateTransactionDataResponse: (exprectedDescriptorId: string, params: {
        transaction_data_hashes: string[];
        transaction_data_hashes_alg?: string[];
    }) => Promise<{
        status: boolean;
        message: string;
    }>;
} | null;
//# sourceMappingURL=transactionData.d.ts.map