import { CLOCK_TOLERANCE } from "../config";
import { IHttpProxy } from "./interfaces/IHttpProxy";
import { ParsingEngine, SDJWTVCParser, PublicKeyResolverEngine, SDJWTVCVerifier, MsoMdocParser, MsoMdocVerifier } from "wallet-common";
import { IOpenID4VCIHelper } from "./interfaces/IOpenID4VCIHelper";

export async function initializeCredentialEngine(
	httpProxy: IHttpProxy,
	helper: IOpenID4VCIHelper,
	getIssuers: () => Promise<Record<string, unknown>[]>,
	trustedCertificates: string[] = [],
	shouldUseCache: boolean = true,
	onIssuerMetadataResolved?: (issuerIdentifier: string) => void
): Promise<any> {

	const ctx = {
		clockTolerance: CLOCK_TOLERANCE,
		subtle: crypto.subtle,
		lang: 'en-US',
		trustedCertificates,
	};

	helper.fetchIssuerMetadataAndCertificates(
		getIssuers,
		(pemCerts) => trustedCertificates.push(...pemCerts),
		shouldUseCache,
		(issuerIdentifier) => {
			onIssuerMetadataResolved?.(issuerIdentifier);
		}
	).catch((err) => {
		console.error("Failed to fetch issuer metadata asynchronously:", err);
	});

	const credentialParsingEngine = ParsingEngine();
	credentialParsingEngine.register(SDJWTVCParser({ context: ctx, httpClient: httpProxy }));
	credentialParsingEngine.register(MsoMdocParser({ context: ctx, httpClient: httpProxy }));

	const pkResolverEngine = PublicKeyResolverEngine();
	const sdJwtVerifier = SDJWTVCVerifier({ context: ctx, pkResolverEngine: pkResolverEngine, httpClient: httpProxy });
	const msoMdocVerifier = MsoMdocVerifier({ context: ctx, pkResolverEngine: pkResolverEngine });

	return { credentialParsingEngine, sdJwtVerifier, msoMdocVerifier };
}
