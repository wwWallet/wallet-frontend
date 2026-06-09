import { GenericStore, Result } from "../../core";
import { HttpClient } from "../../interfaces";
import { OpenID4VPOptions, PresentationInfo, OpenID4VPResponseMode, RPState } from "./types";
export declare const OpenID4VPClientErrors: {
    readonly MissingRPStateForKid: "missing_rpstate_for_kid";
    readonly MissingRPState: "missing_rpstate";
    readonly JWEDecryptionFailure: "jwe_decryption_failure";
    readonly MissingState: "missing_state";
    readonly PresentationAlreadyCompleted: "presentation_already_completed";
    readonly MissingVpToken: "missing_vp_token";
    readonly MissingPresentationSubmissionAndVpToken: "missing_presentation_submission_and_vp_token";
    readonly SignedRequestObjectInvalidated: "signed_request_object_invalidated";
};
export type OpenID4VPClientError = typeof OpenID4VPClientErrors[keyof typeof OpenID4VPClientErrors];
export declare class OpenID4VPClientAPI {
    private rpStateKV;
    private options;
    private httpClient;
    constructor(kvStore: GenericStore<string, RPState | string>, options: OpenID4VPOptions, httpClient: HttpClient);
    private initializeCredentialEngine;
    generateAuthorizationRequestURL(presentationRequest: any, sessionId: string, responseUri: string, baseUri: string, privateKeyPem: string, x5c: string[], responseMode: OpenID4VPResponseMode, callbackEndpoint?: string): Promise<{
        url: URL;
        stateId: string;
        rpState: RPState;
    }>;
    saveRPState(sessionId: string, state: RPState): Promise<void>;
    private saveResponseCodeMapping;
    private validateDcqlVpToken;
    getPresentationBySessionId(sessionId?: string, cleanupSession?: boolean): Promise<{
        status: true;
        presentations: unknown[];
        presentationInfo: PresentationInfo;
        rpState: RPState;
    } | {
        status: false;
        error: Error;
    }>;
    getRPStateByResponseCode(responseCode: string): Promise<RPState | null>;
    getRPStateBySessionId(sessionId: string): Promise<RPState | null>;
    getRPStateByKid(kid: string): Promise<RPState | null>;
    handleResponseJARM(response: any, kid: string): Promise<Result<RPState, OpenID4VPClientError>>;
    handleResponseDirectPost(state: string | undefined, vp_token: Record<string, string[]> | undefined, presentation_submission: any): Promise<Result<RPState, OpenID4VPClientError>>;
    getSignedRequestObject(sessionId: string): Promise<Result<string, OpenID4VPClientError>>;
}
//# sourceMappingURL=OpenID4VPClientAPI.d.ts.map