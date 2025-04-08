import { CLOCK_TOLERANCE } from "../config";
import { IHttpProxy } from "./interfaces/IHttpProxy";
import { ParsingEngine, SDJWTVCParser, PublicKeyResolverEngine, SDJWTVCVerifier, MsoMdocParser, MsoMdocVerifier } from "core";
import { IOpenID4VCIHelper } from "./interfaces/IOpenID4VCIHelper";

export async function initializeCredentialEngine(httpProxy: IHttpProxy, helper: IOpenID4VCIHelper, credentialIssuerEntities: Record<string, unknown>[] = [], trustedCertificates: string[] = []) {

	const ctx = {
		clockTolerance: CLOCK_TOLERANCE,
		subtle: crypto.subtle,
		lang: 'en-US',
		trustedCertificates: trustedCertificates,
	};

	const result = await Promise.all(credentialIssuerEntities.map(async (issuerEntity) =>
		"credentialIssuerIdentifier" in issuerEntity && typeof issuerEntity.credentialIssuerIdentifier === "string" ?
			helper.getCredentialIssuerMetadata(issuerEntity.credentialIssuerIdentifier).then((result =>
				result.metadata
			)) : null
	));

	for (const r of result) {
		if (r == null) {
			continue;
		}
		if (r.mdoc_iacas_uri) {
			try {
				const response = await helper.getMdocIacas(r.credential_issuer);
				if (!response.iacas) {
					continue;
				}
				const pemCertificates = response.iacas.map((cert) =>
					`-----BEGIN CERTIFICATE-----\n${cert.certificate}\n-----END CERTIFICATE-----\n`
				)
				ctx.trustedCertificates.push(...pemCertificates);
			}
			catch (err) {
				continue;
			}
		}
	}

	const credentialParsingEngine = ParsingEngine();
	credentialParsingEngine.register(SDJWTVCParser({ context: ctx, httpClient: httpProxy }));
	credentialParsingEngine.register(MsoMdocParser({ context: ctx, httpClient: httpProxy }));

	const pkResolverEngine = PublicKeyResolverEngine();
	const sdJwtVerifier = SDJWTVCVerifier({ context: ctx, pkResolverEngine: pkResolverEngine });
	const msoMdocVerifier = MsoMdocVerifier({ context: ctx, pkResolverEngine: pkResolverEngine });

	return { credentialParsingEngine, sdJwtVerifier, msoMdocVerifier };
}
