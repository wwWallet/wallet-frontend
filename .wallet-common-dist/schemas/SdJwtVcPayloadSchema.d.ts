import { z } from "zod";
export declare const SdJwtVcPayloadSchema: z.ZodObject<{
    iss: z.ZodOptional<z.ZodString>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
    vct: z.ZodString;
    cnf: z.ZodOptional<z.ZodObject<{
        jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        jwk?: Record<string, any> | undefined;
    }, {
        jwk?: Record<string, any> | undefined;
    }>>;
    vc: z.ZodOptional<z.ZodObject<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: string[] | undefined;
        "@context"?: string[] | undefined;
    }, {
        type?: string[] | undefined;
        "@context"?: string[] | undefined;
    }>>;
    _sd: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    _sd_alg: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    iss: z.ZodOptional<z.ZodString>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
    vct: z.ZodString;
    cnf: z.ZodOptional<z.ZodObject<{
        jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        jwk?: Record<string, any> | undefined;
    }, {
        jwk?: Record<string, any> | undefined;
    }>>;
    vc: z.ZodOptional<z.ZodObject<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: string[] | undefined;
        "@context"?: string[] | undefined;
    }, {
        type?: string[] | undefined;
        "@context"?: string[] | undefined;
    }>>;
    _sd: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    _sd_alg: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    iss: z.ZodOptional<z.ZodString>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
    vct: z.ZodString;
    cnf: z.ZodOptional<z.ZodObject<{
        jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        jwk?: Record<string, any> | undefined;
    }, {
        jwk?: Record<string, any> | undefined;
    }>>;
    vc: z.ZodOptional<z.ZodObject<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type?: string[] | undefined;
        "@context"?: string[] | undefined;
    }, {
        type?: string[] | undefined;
        "@context"?: string[] | undefined;
    }>>;
    _sd: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    _sd_alg: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export type SdJwtVcPayload = z.infer<typeof SdJwtVcPayloadSchema>;
//# sourceMappingURL=SdJwtVcPayloadSchema.d.ts.map