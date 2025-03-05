import { HttpClient, OpenID4VCICredentialRendering } from "../interfaces";

export function OpenID4VCICredentialRendering(args: { httpClient: HttpClient }): OpenID4VCICredentialRendering {
	return {
		renderCustomSvgTemplate(args) {
			throw new Error("Not implemented");
		},
	}
}
