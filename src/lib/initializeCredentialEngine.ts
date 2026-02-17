import { CLOCK_TOLERANCE, VCT_REGISTRY_URL } from "../config";
import { IHttpProxy } from "./interfaces/IHttpProxy";
import { ParsingEngine, SDJWTVCParser, PublicKeyResolverEngine, SDJWTVCVerifier, MsoMdocParser, MsoMdocVerifier } from "wallet-common";
import { IOpenID4VCIHelper } from "./interfaces/IOpenID4VCIHelper";
import { createVctDocumentResolutionEngine, VctDocumentProvider, VctResolutionErrors, ok, err } from 'wallet-common';

export async function initializeCredentialEngine(
	httpProxy: IHttpProxy,
	helper: IOpenID4VCIHelper,
	getIssuers: () => Promise<Record<string, unknown>[]>,
	trustedCertificates: string[] = [],
	shouldUseCache: boolean = true,
	onIssuerMetadataResolved?: (issuerIdentifier: string) => void
): Promise<any> {

	const provider: VctDocumentProvider = {
		getVctMetadataDocument: async (vct: string) => {
			try {
				if (!VCT_REGISTRY_URL) return err(VctResolutionErrors.NotFound);
				const url = new URL(VCT_REGISTRY_URL);
				url.searchParams.set('vct', vct);
				const res = await httpProxy.get(url.toString(), {}, { useCache: true });
				if (!res?.data || res.status!==200) return err(VctResolutionErrors.NotFound);
				return ok(res.data as any);
			} catch (e) {
				console.error('Error in VCT SDJWT Metadata retrieval: ' + JSON.stringify(e));
				return err(VctResolutionErrors.NotFound);
			}
		},
	};

	const vctDocumentProvider = createVctDocumentResolutionEngine([provider]);

	const ctx = {
		clockTolerance: CLOCK_TOLERANCE,
		subtle: crypto.subtle,
		lang: 'en-US',
		trustedCertificates,
		vctResolutionEngine: vctDocumentProvider
	};

	await helper.fetchIssuerMetadataAndCertificates(
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
