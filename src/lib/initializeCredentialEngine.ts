import { CLOCK_TOLERANCE } from "../config";
import { IHttpProxy } from "./interfaces/IHttpProxy";
import { ParsingEngine, SDJWTVCParser, PublicKeyResolverEngine, VerifyingEngine, SDJWTVCVerifier } from "core";

export function initializeCredentialEngine(httpProxy: IHttpProxy) {

	const ctx = {
		clockTolerance: CLOCK_TOLERANCE,
		subtle: crypto.subtle,
		lang: 'en-US',
		trustedCertificates: [],
	};
	const credentialParsingEngine = ParsingEngine();
	credentialParsingEngine.register(SDJWTVCParser({ context: ctx, httpClient: httpProxy }));

	const pkResolverEngine = PublicKeyResolverEngine();
	const verifyingEngine = VerifyingEngine();
	verifyingEngine.register(SDJWTVCVerifier({ context: ctx, pkResolverEngine: pkResolverEngine }));
	return { credentialParsingEngine, verifyingEngine };
}
