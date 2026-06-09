import { OpenID4VPRelyingPartyState, OpenID4VPServerLastUsedNonceStore, OpenID4VPServerMessages, TransactionDataResponseGenerator, TransactionDataResponseGeneratorParams, TransactionDataResponseParams, OpenID4VPTrustEvaluator, TrustEvaluationResult, DIDResolver } from "./types";
export declare const HandleAuthorizationRequestErrors: {
    readonly NON_SUPPORTED_CLIENT_ID_SCHEME: "non_supported_client_id_scheme";
    readonly INSUFFICIENT_CREDENTIALS: "insufficient_credentials";
    readonly MISSING_DCQL_QUERY: "missing_dcql_query";
    readonly NONTRUSTED_VERIFIER: "nontrusted_verifier";
    readonly INVALID_RESPONSE_MODE: "invalid_response_mode";
    readonly OLD_STATE: "old_state";
    readonly INVALID_TRANSACTION_DATA: "invalid_transaction_data";
    readonly INVALID_TYP: "invalid_jwt_typ";
    readonly COULD_NOT_RESOLVE_REQUEST: "could_not_resolve_request";
};
export type HandleAuthorizationRequestError = typeof HandleAuthorizationRequestErrors[keyof typeof HandleAuthorizationRequestErrors];
type OpenID4VPServerKeystore = {
    signJwtPresentation(nonce: string, audience: string, presentations: string[], transactionDataResponseParams?: TransactionDataResponseParams): Promise<{
        vpjwt: string;
    }>;
    generateDeviceResponse(mdoc: any, presentationDefinition: Record<string, unknown>, apu: string | undefined, apv: string | undefined, clientId: string, responseUri: string): Promise<{
        deviceResponseMDoc: any;
    }>;
};
type OpenID4VPServerDeps<CredentialT extends OpenID4VPServerCredential, ParsedTransactionDataT> = {
    httpClient: {
        get: (url: string, options?: Record<string, unknown>) => Promise<{
            data: unknown;
        }>;
    };
    rpStateStore: {
        store(stateObject: OpenID4VPRelyingPartyState): Promise<void>;
        retrieve(): Promise<OpenID4VPRelyingPartyState>;
    };
    parseCredential: (credential: CredentialT) => Promise<{
        signedClaims: Record<string, unknown>;
    } | null>;
    selectCredentialForBatch: (batchId: number, vcEntityList: CredentialT[]) => Promise<CredentialT | null>;
    keystore: OpenID4VPServerKeystore;
    strings: OpenID4VPServerMessages;
    lastUsedNonceStore?: OpenID4VPServerLastUsedNonceStore;
    parseTransactionData?: (transaction_data: string[], dcql_query: Record<string, unknown>) => ParsedTransactionDataT[] | null;
    transactionDataResponseGenerator?: (params: TransactionDataResponseGeneratorParams) => TransactionDataResponseGenerator;
    /**
     * Trust evaluator for verifier authentication.
     * Required - all trust evaluation is delegated to the AuthZEN backend.
     * Supports all client_id schemes (did:web, https, x509_san_dns, etc.).
     */
    evaluateTrust: OpenID4VPTrustEvaluator;
    /**
     * DID resolver for verifying JWTs signed with DID-referenced keys.
     * Required for DID client_id schemes (did:web, did:jwk, etc.).
     * If not provided, DID-based verification will fail.
     */
    resolveDid?: DIDResolver;
    subtle?: SubtleCrypto;
    randomUUID?: () => string;
};
export type OpenID4VPServerCredential = {
    format: string;
    data: string;
    batchId?: number;
    instanceId?: number;
    credentialId?: number;
};
export declare class OpenID4VPServerAPI<CredentialT extends OpenID4VPServerCredential, ParsedTransactionDataT> {
    private deps;
    constructor(deps: OpenID4VPServerDeps<CredentialT, ParsedTransactionDataT>);
    private parseAuthorizationParams;
    /**
     * Resolve a public key for JWT verification based on the header.
     *
     * Supports:
     * - x5c: Certificate chain (extracts public key from first cert)
     * - jwk: Embedded JWK in header
     * - kid with DID reference: Resolves DID document and finds matching key
     */
    private resolveVerificationKey;
    /**
     * Find a verification key in a DID document by kid.
     * Searches verificationMethod, authentication, and assertionMethod.
     */
    private findKeyInDIDDocument;
    private handleRequestUri;
    private matchCredentialsToDCQL;
    private convertDcqlToPresentationDefinition;
    private generatePresentationFrameForDCQLPaths;
    private handleDCQLFlow;
    handleAuthorizationRequest(url: string, vcEntityList: CredentialT[]): Promise<{
        conformantCredentialsMap: Map<string, any>;
        verifierDomainName: string;
        verifierPurpose: string;
        parsedTransactionData: ParsedTransactionDataT[] | null;
        trustInfo?: TrustEvaluationResult;
    } | {
        error: HandleAuthorizationRequestError;
    }>;
    createAuthorizationResponse(selectionMap: Map<string, number>, vcEntityList: CredentialT[]): Promise<{
        formData?: undefined;
        generatedVPs?: undefined;
        presentationSubmission?: undefined;
        filteredVCEntities?: undefined;
        response_uri?: undefined;
        client_id?: undefined;
        state?: undefined;
    } | {
        formData: URLSearchParams;
        generatedVPs: string[];
        presentationSubmission: {
            id: string;
            descriptor_map: {
                id: string;
                path: string;
            }[];
        };
        filteredVCEntities: CredentialT[];
        response_uri: string;
        client_id: string;
        state: string;
    }>;
}
export {};
//# sourceMappingURL=OpenID4VPServerAPI.d.ts.map