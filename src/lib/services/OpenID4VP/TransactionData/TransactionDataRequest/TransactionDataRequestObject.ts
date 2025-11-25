import { z } from "zod";

const sha256 = z.literal("sha-256");

export const TransactionDataRequestObject = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("urn:wwwallet:example_transaction_data_type"),
		credential_ids: z.array(z.string()),
	}).strict(),

	z.object({
		type: z.literal("qes_authorization"),
		credential_ids: z.array(z.string()),
		signatureQualifier: z.string(),
		transaction_data_hashes_alg: sha256,
		documentDigests: z.array(z.object({
			hash: z.string().optional(),
			label: z.string(),
			hashAlgorithmOID: z.string(),
		})),
	}).strict(),

	z.object({
		type: z.literal("qcert_creation_acceptance"),
		credential_ids: z.array(z.string()),
		QC_terms_conditions_uri: z.string().optional(),
		QC_hash: z.string().optional(),
		QC_hashAlgorithmOID: z.string().optional(),
		transaction_data_hashes_alg: sha256,
	}).strict(),

	z.object({
		type: z.literal("https://cloudsignatureconsortium.org/2025/qes"),
		credential_ids: z.array(z.string()),
		numSignatures: z.number().optional(),
		signatureQualifier: z.string(),
		transaction_data_hashes_alg: sha256,
		documentDigests: z.array(z.object({
			hash: z.string().optional(),
			label: z.string(),
			hashType: z.string(),
		})),
		processID: z.string().optional(),
	}).strict(),

	z.object({
		type: z.literal("https://cloudsignatureconsortium.org/2025/qc-request"),
		credential_ids: z.array(z.string()),
		QC_terms_conditions_uri: z.string().optional(),
		QC_hash: z.string().optional(),
		QC_hashAlgorithmOID: z.string().optional(),
		transaction_data_hashes_alg: sha256,
	}).strict(),
]);


export type TransactionDataRequest = z.infer<typeof TransactionDataRequestObject>;
