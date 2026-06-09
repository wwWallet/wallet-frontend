import z from 'zod';
export declare const OpenidCredentialIssuerMetadataSchema: z.ZodObject<{
    credential_issuer: z.ZodString;
    credential_endpoint: z.ZodString;
    nonce_endpoint: z.ZodOptional<z.ZodString>;
    credential_request_encryption: z.ZodOptional<z.ZodObject<{
        jwks: z.ZodObject<{
            keys: z.ZodArray<z.ZodObject<{
                kid: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "strip", z.ZodTypeAny, {
            keys: z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        }, {
            keys: z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        }>;
        enc_values_supported: z.ZodArray<z.ZodString, "many">;
        zip_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryption_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        jwks: {
            keys: z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        };
        enc_values_supported: string[];
        encryption_required: boolean;
        zip_values_supported?: string[] | undefined;
    }, {
        jwks: {
            keys: z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        };
        enc_values_supported: string[];
        encryption_required: boolean;
        zip_values_supported?: string[] | undefined;
    }>>;
    credential_response_encryption: z.ZodOptional<z.ZodObject<{
        alg_values_supported: z.ZodArray<z.ZodString, "many">;
        enc_values_supported: z.ZodArray<z.ZodString, "many">;
        zip_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryption_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enc_values_supported: string[];
        encryption_required: boolean;
        alg_values_supported: string[];
        zip_values_supported?: string[] | undefined;
    }, {
        enc_values_supported: string[];
        encryption_required: boolean;
        alg_values_supported: string[];
        zip_values_supported?: string[] | undefined;
    }>>;
    authorization_servers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    display: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        locale: z.ZodOptional<z.ZodString>;
        logo: z.ZodOptional<z.ZodObject<{
            uri: z.ZodString;
            alt_text: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            alt_text?: string | undefined;
        }, {
            uri: string;
            alt_text?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        logo?: {
            uri: string;
            alt_text?: string | undefined;
        } | undefined;
        locale?: string | undefined;
        name?: string | undefined;
    }, {
        logo?: {
            uri: string;
            alt_text?: string | undefined;
        } | undefined;
        locale?: string | undefined;
        name?: string | undefined;
    }>, "many">>;
    batch_credential_issuance: z.ZodOptional<z.ZodObject<{
        batch_size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        batch_size: number;
    }, {
        batch_size: number;
    }>>;
    deferred_credential_endpoint: z.ZodOptional<z.ZodString>;
    credential_configurations_supported: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, z.ZodTypeAny, "passthrough">>]>>;
    signed_metadata: z.ZodOptional<z.ZodString>;
    mdoc_iacas_uri: z.ZodOptional<z.ZodString>;
    notification_endpoint: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    credential_issuer: z.ZodString;
    credential_endpoint: z.ZodString;
    nonce_endpoint: z.ZodOptional<z.ZodString>;
    credential_request_encryption: z.ZodOptional<z.ZodObject<{
        jwks: z.ZodObject<{
            keys: z.ZodArray<z.ZodObject<{
                kid: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "strip", z.ZodTypeAny, {
            keys: z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        }, {
            keys: z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        }>;
        enc_values_supported: z.ZodArray<z.ZodString, "many">;
        zip_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryption_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        jwks: {
            keys: z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        };
        enc_values_supported: string[];
        encryption_required: boolean;
        zip_values_supported?: string[] | undefined;
    }, {
        jwks: {
            keys: z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        };
        enc_values_supported: string[];
        encryption_required: boolean;
        zip_values_supported?: string[] | undefined;
    }>>;
    credential_response_encryption: z.ZodOptional<z.ZodObject<{
        alg_values_supported: z.ZodArray<z.ZodString, "many">;
        enc_values_supported: z.ZodArray<z.ZodString, "many">;
        zip_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryption_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enc_values_supported: string[];
        encryption_required: boolean;
        alg_values_supported: string[];
        zip_values_supported?: string[] | undefined;
    }, {
        enc_values_supported: string[];
        encryption_required: boolean;
        alg_values_supported: string[];
        zip_values_supported?: string[] | undefined;
    }>>;
    authorization_servers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    display: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        locale: z.ZodOptional<z.ZodString>;
        logo: z.ZodOptional<z.ZodObject<{
            uri: z.ZodString;
            alt_text: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            alt_text?: string | undefined;
        }, {
            uri: string;
            alt_text?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        logo?: {
            uri: string;
            alt_text?: string | undefined;
        } | undefined;
        locale?: string | undefined;
        name?: string | undefined;
    }, {
        logo?: {
            uri: string;
            alt_text?: string | undefined;
        } | undefined;
        locale?: string | undefined;
        name?: string | undefined;
    }>, "many">>;
    batch_credential_issuance: z.ZodOptional<z.ZodObject<{
        batch_size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        batch_size: number;
    }, {
        batch_size: number;
    }>>;
    deferred_credential_endpoint: z.ZodOptional<z.ZodString>;
    credential_configurations_supported: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, z.ZodTypeAny, "passthrough">>]>>;
    signed_metadata: z.ZodOptional<z.ZodString>;
    mdoc_iacas_uri: z.ZodOptional<z.ZodString>;
    notification_endpoint: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    credential_issuer: z.ZodString;
    credential_endpoint: z.ZodString;
    nonce_endpoint: z.ZodOptional<z.ZodString>;
    credential_request_encryption: z.ZodOptional<z.ZodObject<{
        jwks: z.ZodObject<{
            keys: z.ZodArray<z.ZodObject<{
                kid: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>, "many">;
        }, "strip", z.ZodTypeAny, {
            keys: z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        }, {
            keys: z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        }>;
        enc_values_supported: z.ZodArray<z.ZodString, "many">;
        zip_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryption_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        jwks: {
            keys: z.objectOutputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        };
        enc_values_supported: string[];
        encryption_required: boolean;
        zip_values_supported?: string[] | undefined;
    }, {
        jwks: {
            keys: z.objectInputType<{
                kid: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
        };
        enc_values_supported: string[];
        encryption_required: boolean;
        zip_values_supported?: string[] | undefined;
    }>>;
    credential_response_encryption: z.ZodOptional<z.ZodObject<{
        alg_values_supported: z.ZodArray<z.ZodString, "many">;
        enc_values_supported: z.ZodArray<z.ZodString, "many">;
        zip_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        encryption_required: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        enc_values_supported: string[];
        encryption_required: boolean;
        alg_values_supported: string[];
        zip_values_supported?: string[] | undefined;
    }, {
        enc_values_supported: string[];
        encryption_required: boolean;
        alg_values_supported: string[];
        zip_values_supported?: string[] | undefined;
    }>>;
    authorization_servers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    display: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        locale: z.ZodOptional<z.ZodString>;
        logo: z.ZodOptional<z.ZodObject<{
            uri: z.ZodString;
            alt_text: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            alt_text?: string | undefined;
        }, {
            uri: string;
            alt_text?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        logo?: {
            uri: string;
            alt_text?: string | undefined;
        } | undefined;
        locale?: string | undefined;
        name?: string | undefined;
    }, {
        logo?: {
            uri: string;
            alt_text?: string | undefined;
        } | undefined;
        locale?: string | undefined;
        name?: string | undefined;
    }>, "many">>;
    batch_credential_issuance: z.ZodOptional<z.ZodObject<{
        batch_size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        batch_size: number;
    }, {
        batch_size: number;
    }>>;
    deferred_credential_endpoint: z.ZodOptional<z.ZodString>;
    credential_configurations_supported: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodUnion<[z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodUnion<[z.ZodLiteral<import("..").VerifiableCredentialFormat.VC_SDJWT>, z.ZodLiteral<import("..").VerifiableCredentialFormat.DC_SDJWT>]>;
        vct: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.MSO_MDOC>;
        doctype: z.ZodString;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, z.ZodTypeAny, "passthrough">>]>, z.ZodObject<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        credential_metadata: z.ZodOptional<z.ZodObject<{
            display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                description: z.ZodOptional<z.ZodString>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                }, {
                    uri: string;
                }>>;
                locale: z.ZodOptional<z.ZodString>;
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    alt_text?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }, {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }>, "many">>;
            claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
                path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
                mandatory: z.ZodOptional<z.ZodBoolean>;
                display: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodOptional<z.ZodString>;
                    locale: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }, {
                    locale?: string | undefined;
                    name?: string | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }, {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }, {
            display?: {
                name: string;
                alt_text?: string | undefined;
                logo?: {
                    uri: string;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
                locale?: string | undefined;
                description?: string | undefined;
            }[] | undefined;
            claims?: {
                path: [string | number | null, ...(string | number | null)[]];
                display?: {
                    locale?: string | undefined;
                    name?: string | undefined;
                }[] | undefined;
                mandatory?: boolean | undefined;
            }[] | undefined;
        }>>;
        scope: z.ZodString;
        cryptographic_binding_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        credential_signing_alg_values_supported: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proof_types_supported: z.ZodOptional<z.ZodObject<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            jwt: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
            attestation: z.ZodOptional<z.ZodObject<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                proof_signing_alg_values_supported: z.ZodArray<z.ZodString, "many">;
                key_attestations_required: z.ZodOptional<z.ZodObject<{
                    key_storage: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                    user_authentication: z.ZodOptional<z.ZodArray<z.ZodEnum<["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"]>, "many">>;
                }, "strip", z.ZodTypeAny, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }, {
                    key_storage?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                    user_authentication?: ("iso_18045_high" | "iso_18045_moderate" | "iso_18045_enhanced-basic" | "iso_18045_basic")[] | undefined;
                }>>;
            }, z.ZodTypeAny, "passthrough">>>;
        }, z.ZodTypeAny, "passthrough">>>;
    } & {
        format: z.ZodLiteral<import("..").VerifiableCredentialFormat.JWT_VC_JSON>;
    }, z.ZodTypeAny, "passthrough">>]>>;
    signed_metadata: z.ZodOptional<z.ZodString>;
    mdoc_iacas_uri: z.ZodOptional<z.ZodString>;
    notification_endpoint: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type OpenidCredentialIssuerMetadata = z.infer<typeof OpenidCredentialIssuerMetadataSchema>;
//# sourceMappingURL=OpenidCredentialIssuerMetadataSchema.d.ts.map