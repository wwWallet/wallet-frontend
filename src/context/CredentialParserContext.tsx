import React, { useEffect, createContext } from "react";
import { ICredentialParser, ICredentialParserRegistry } from "../lib/interfaces/ICredentialParser";
import { useCredentialParserRegistry } from "../lib/services/CredentialParserRegistry";
import { parseSdJwtCredential } from "../functions/parseSdJwtCredential";
import { useOpenID4VCIHelper } from "../lib/services/OpenID4VCIHelper";
import { getSdJwtVcMetadata } from "../lib/utils/getSdJwtVcMetadata";
import defaultCredentialImage from "../assets/images/cred.png";
import renderSvgTemplate from "../components/Credentials/RenderSvgTemplate";
import renderCustomSvgTemplate from "../components/Credentials/RenderCustomSvgTemplate";


export type CredentialParserContextValue = {
	credentialParserRegistry: ICredentialParserRegistry;
}

const CredentialParserContext: React.Context<CredentialParserContextValue> = createContext({
	credentialParserRegistry: null
});

const defaultLocale = 'en-US';


export const CredentialParserContextProvider = ({ children }) => {

	const credentialParserRegistry = useCredentialParserRegistry();
	const openID4VCIHelper = useOpenID4VCIHelper();

	const parser1: ICredentialParser = {
		async parse(rawCredential) {

			if (typeof rawCredential != 'string') {
				return { error: "rawCredential not of type 'string'" };

			}
			const result = await parseSdJwtCredential(rawCredential);
			if ('error' in result) {
				return { error: "Failed to parse sdjwt" };
			}
			let credentialConfigurationSupportedObj = null;
			const metadataResponse = await openID4VCIHelper.getCredentialIssuerMetadata(result.beautifiedForm.iss);
			if (metadataResponse) {
				const { metadata } = metadataResponse;
				credentialConfigurationSupportedObj = Object.values(metadata.credential_configurations_supported)
					.filter((x: any) => x?.vct && result.beautifiedForm?.vct && x.vct === result.beautifiedForm?.vct)
				[0];
			}

			const getSdJwtVcMetadataResult = await getSdJwtVcMetadata(rawCredential);

			// Validate the metadata object
			const isValidMetadata = !('error' in getSdJwtVcMetadataResult) && getSdJwtVcMetadataResult.credentialMetadata;

			// Extract metadata and claims
			const metadata = isValidMetadata && getSdJwtVcMetadataResult.credentialMetadata?.display?.find((d) => d.lang === defaultLocale) || null;
			const claims = isValidMetadata && getSdJwtVcMetadataResult.credentialMetadata?.claims?.length
				? getSdJwtVcMetadataResult.credentialMetadata.claims
				: null;

			// Extract key values
			const credentialImageSvgTemplateURL = metadata?.rendering?.svg_templates?.[0]?.uri || null;
			const credentialFriendlyName = metadata?.name || "Credential";
			const credentialDescription = metadata?.description || "Verifiable Credential";
			const simple = metadata?.rendering?.simple || null;

			// Render SVG content
			const svgContent = await renderSvgTemplate({
				beautifiedForm: result.beautifiedForm,
				credentialImageSvgTemplateURL,
				claims
			});

			// Extract issuer metadata
			const issuerMetadata = credentialConfigurationSupportedObj?.display?.[0];

			if (svgContent) {
				return {
					beautifiedForm: result.beautifiedForm,
					credentialImage: {
						credentialImageURL: svgContent
					},
					credentialFriendlyName,
				}
			}
			else if (simple) {
				// Simple style
				let logoURL = simple?.logo?.uri || null;
				let logoAltText = simple?.logo?.alt_text || 'Credential logo';
				let backgroundColor = simple?.background_color || '#808080';
				let textColor = simple?.text_color || '#000000';

				const svgCustomContent = await renderCustomSvgTemplate({ beautifiedForm: result.beautifiedForm, name: credentialFriendlyName, description: credentialDescription, logoURL, logoAltText, backgroundColor, textColor, backgroundImageURL: null });
				return {
					beautifiedForm: result.beautifiedForm,
					credentialImage: {
						credentialImageURL: svgCustomContent || defaultCredentialImage,
					},
					credentialFriendlyName,
				}
			}
			else if (issuerMetadata) {
				// Issuer Metadata style
				let name = issuerMetadata?.name || 'Credential';
				let description = issuerMetadata?.description || '';
				let logoURL = issuerMetadata?.logo?.uri || null;
				let logoAltText = issuerMetadata?.logo?.alt_text || 'Credential logo';
				let backgroundColor = issuerMetadata?.background_color || '#808080';
				let textColor = issuerMetadata?.text_color || '#000000';
				let backgroundImageURL = issuerMetadata?.background_image?.uri || null;

				const svgCustomContent = await renderCustomSvgTemplate({ beautifiedForm: result.beautifiedForm, name, description, logoURL, logoAltText, backgroundColor, textColor, backgroundImageURL });
				return {
					beautifiedForm: result.beautifiedForm,
					credentialImage: {
						credentialImageURL: svgCustomContent || defaultCredentialImage,
					},
					credentialFriendlyName,
				}
			}

			return {
				beautifiedForm: result.beautifiedForm,
				credentialImage: {
					credentialImageURL: defaultCredentialImage,
				},
				credentialFriendlyName,
			}

		},
	}
	useEffect(() => {
		credentialParserRegistry.setParsers([ parser1 ]);
	}, [openID4VCIHelper])


	return (
		<CredentialParserContext.Provider value={{ credentialParserRegistry }}>
			{children}
		</CredentialParserContext.Provider>
	);
}


export const withCredentialParserContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<CredentialParserContextProvider>
			<Component {...props} />
		</CredentialParserContextProvider>
	);
export default CredentialParserContext;
