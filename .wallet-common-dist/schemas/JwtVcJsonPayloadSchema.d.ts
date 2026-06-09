import { z } from "zod";
export declare const JwtVcJsonHeaderSchema: z.ZodObject<{
    alg: z.ZodString;
    typ: z.ZodOptional<z.ZodString>;
    kid: z.ZodOptional<z.ZodString>;
    x5c: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    alg: z.ZodString;
    typ: z.ZodOptional<z.ZodString>;
    kid: z.ZodOptional<z.ZodString>;
    x5c: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    alg: z.ZodString;
    typ: z.ZodOptional<z.ZodString>;
    kid: z.ZodOptional<z.ZodString>;
    x5c: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const JwtVcJsonPayloadSchema: z.ZodObject<{
    iss: z.ZodOptional<z.ZodString>;
    sub: z.ZodOptional<z.ZodString>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
    jti: z.ZodOptional<z.ZodString>;
    vc: z.ZodOptional<z.ZodObject<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    cnf: z.ZodOptional<z.ZodObject<{
        jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        jwk?: Record<string, any> | undefined;
    }, {
        jwk?: Record<string, any> | undefined;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    iss: z.ZodOptional<z.ZodString>;
    sub: z.ZodOptional<z.ZodString>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
    jti: z.ZodOptional<z.ZodString>;
    vc: z.ZodOptional<z.ZodObject<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    cnf: z.ZodOptional<z.ZodObject<{
        jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        jwk?: Record<string, any> | undefined;
    }, {
        jwk?: Record<string, any> | undefined;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    iss: z.ZodOptional<z.ZodString>;
    sub: z.ZodOptional<z.ZodString>;
    iat: z.ZodOptional<z.ZodNumber>;
    nbf: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
    jti: z.ZodOptional<z.ZodString>;
    vc: z.ZodOptional<z.ZodObject<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        "@context": z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        type: z.ZodArray<z.ZodString, "many">;
        credentialSubject: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.ZodTypeAny, "passthrough">>>;
    cnf: z.ZodOptional<z.ZodObject<{
        jwk: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        jwk?: Record<string, any> | undefined;
    }, {
        jwk?: Record<string, any> | undefined;
    }>>;
}, z.ZodTypeAny, "passthrough">>;
export type JwtVcJsonHeader = z.infer<typeof JwtVcJsonHeaderSchema>;
export type JwtVcJsonPayload = z.infer<typeof JwtVcJsonPayloadSchema>;
//# sourceMappingURL=JwtVcJsonPayloadSchema.d.ts.map