import { CLOCK_TOLERANCE } from "../config";
import { IHttpProxy } from "./interfaces/IHttpProxy";
import { ParsingEngine, SDJWTVCParser, PublicKeyResolverEngine, SDJWTVCVerifier, MsoMdocParser, MsoMdocVerifier } from "core";
import { IOpenID4VCIHelper } from "./interfaces/IOpenID4VCIHelper";
import z from 'zod';

const iacasDocumentSchema = z.object({
	iacas: z.array(z.object({
		certificate: z.string()
	}))
});

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
			const iacasFetchResponse = await httpProxy.get(r.mdoc_iacas_uri);
			if (iacasFetchResponse.status !== 200 || !iacasFetchResponse.data) {
				continue;
			}

			const parsed = iacasDocumentSchema.safeParse(iacasFetchResponse.data);
			if (!parsed.success) {
				continue;
			}
			if (!parsed.data.iacas) {
				continue;
			}
			const pemCertificates = parsed.data.iacas.map((cert) =>
				`-----BEGIN CERTIFICATE-----\n${cert.certificate}\n-----END CERTIFICATE-----\n`
			)
			ctx.trustedCertificates.push(...pemCertificates);
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
