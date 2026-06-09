import { z } from 'zod';
export declare const CredentialOfferSchema: z.ZodObject<{
    credential_issuer: z.ZodString;
    credential_configuration_ids: z.ZodArray<z.ZodString, "many">;
    grants: z.ZodObject<{
        authorization_code: z.ZodOptional<z.ZodObject<{
            issuer_state: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            issuer_state?: string | undefined;
        }, {
            issuer_state?: string | undefined;
        }>>;
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": z.ZodOptional<z.ZodObject<{
            "pre-authorized_code": z.ZodString;
            tx_code: z.ZodOptional<z.ZodObject<{
                input_mode: z.ZodOptional<z.ZodString>;
                length: z.ZodOptional<z.ZodNumber>;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            }, {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        }, {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodRecord<z.ZodString, z.ZodUnknown>, z.objectOutputType<{
        authorization_code: z.ZodOptional<z.ZodObject<{
            issuer_state: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            issuer_state?: string | undefined;
        }, {
            issuer_state?: string | undefined;
        }>>;
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": z.ZodOptional<z.ZodObject<{
            "pre-authorized_code": z.ZodString;
            tx_code: z.ZodOptional<z.ZodObject<{
                input_mode: z.ZodOptional<z.ZodString>;
                length: z.ZodOptional<z.ZodNumber>;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            }, {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        }, {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        }>>;
    }, z.ZodRecord<z.ZodString, z.ZodUnknown>, "strip">, z.objectInputType<{
        authorization_code: z.ZodOptional<z.ZodObject<{
            issuer_state: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            issuer_state?: string | undefined;
        }, {
            issuer_state?: string | undefined;
        }>>;
        "urn:ietf:params:oauth:grant-type:pre-authorized_code": z.ZodOptional<z.ZodObject<{
            "pre-authorized_code": z.ZodString;
            tx_code: z.ZodOptional<z.ZodObject<{
                input_mode: z.ZodOptional<z.ZodString>;
                length: z.ZodOptional<z.ZodNumber>;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            }, {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        }, {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        }>>;
    }, z.ZodRecord<z.ZodString, z.ZodUnknown>, "strip">>;
}, "strip", z.ZodTypeAny, {
    credential_issuer: string;
    credential_configuration_ids: string[];
    grants: {
        authorization_code?: {
            issuer_state?: string | undefined;
        } | undefined;
        "urn:ietf:params:oauth:grant-type:pre-authorized_code"?: {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        } | undefined;
    } & {
        [k: string]: Record<string, unknown>;
    };
}, {
    credential_issuer: string;
    credential_configuration_ids: string[];
    grants: {
        authorization_code?: {
            issuer_state?: string | undefined;
        } | undefined;
        "urn:ietf:params:oauth:grant-type:pre-authorized_code"?: {
            "pre-authorized_code": string;
            tx_code?: {
                length?: number | undefined;
                description?: string | undefined;
                input_mode?: string | undefined;
            } | undefined;
        } | undefined;
    } & {
        [k: string]: Record<string, unknown>;
    };
}>;
export type CredentialOffer = z.infer<typeof CredentialOfferSchema>;
//# sourceMappingURL=CredentialOfferSchema.d.ts.map