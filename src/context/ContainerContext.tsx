import { useEffect, useState, useContext, createContext } from "react";
import { DIContainer } from "../lib/DIContainer";
import { IHttpProxy } from "../lib/interfaces/IHttpProxy";
import { IOpenID4VCIClient } from "../lib/interfaces/IOpenID4VCIClient";
import { IOpenID4VCIClientStateRepository } from "../lib/interfaces/IOpenID4VCIClientStateRepository";
import { IOpenID4VCIHelper } from "../lib/interfaces/IOpenID4VCIHelper";
import { HttpProxy } from "../lib/services/HttpProxy";
import { OpenID4VCIClientFactory } from "../lib/services/OpenID4VCIClientFactory";
import { OpenID4VCIClientStateRepository } from "../lib/services/OpenID4VCIClientStateRepository";
import { OpenID4VCIHelper } from "../lib/services/OpenID4VCIHelper";
import { ClientConfig } from "../lib/types/ClientConfig";
import { StorableCredential } from "../lib/types/StorableCredential";
import { IOpenID4VPRelyingParty } from "../lib/interfaces/IOpenID4VPRelyingParty";
import { OpenID4VPRelyingParty } from "../lib/services/OpenID4VPRelyingParty";
import { IOpenID4VPRelyingPartyStateRepository } from "../lib/interfaces/IOpenID4VPRelyingPartyStateRepository";
import { OpenID4VPRelyingPartyStateRepository } from "../lib/services/OpenID4VPRelyingPartyStateRepository";
import SessionContext from "../context/SessionContext";
import { ICredentialParserRegistry } from "../lib/interfaces/ICredentialParser";
import { CredentialParserRegistry } from "../lib/services/CredentialParserRegistry";
import { parseSdJwtCredential } from "../functions/parseSdJwtCredential";
import { generateRandomIdentifier } from "../lib/utils/generateRandomIdentifier";
import defaultCredentialImage from "../assets/images/cred.png";
import renderSvgTemplate from "../components/Credentials/RenderSvgTemplate";
import renderCustomSvgTemplate from "../components/Credentials/RenderCustomSvgTemplate";
import StatusContext from "./StatusContext";
import { getSdJwtVcMetadata } from "../lib/utils/getSdJwtVcMetadata";
import { CredentialBatchHelper } from "../lib/services/CredentialBatchHelper";
import { parseJwtVcJsonCredential } from "../functions/parseJwtVcJsonCredential";
import { VerifiableCredentialFormat } from "../lib/schemas/vc";

export type ContainerContextValue = {
	httpProxy: IHttpProxy,
	openID4VPRelyingParty: IOpenID4VPRelyingParty,
	openID4VCIHelper: IOpenID4VCIHelper,
	openID4VCIClients: { [x: string]: IOpenID4VCIClient },
	credentialParserRegistry: ICredentialParserRegistry,
}

const ContainerContext: React.Context<ContainerContextValue> = createContext({
	httpProxy: null,
	openID4VPRelyingParty: null,
	openID4VCIHelper: null,
	openID4VCIClients: {},
	credentialParserRegistry: null,
});

const defaultLocale = 'en-US';

export const ContainerContextProvider = ({ children }) => {
	const { isOnline } = useContext(StatusContext);
	const { isLoggedIn, api, keystore } = useContext(SessionContext);

	const [container, setContainer] = useState<ContainerContextValue>(null);
	const [isInitialized, setIsInitialized] = useState(false); // New flag
	const [shouldUseCache, setShouldUseCache] = useState(true)

	useEffect(() => {
		window.addEventListener('generatedProof', (e) => {
			setIsInitialized(false);
		});

		window.addEventListener('settingsChanged', (e) => {
			setIsInitialized(false);
		});

		window.addEventListener('login', (e) => {
			setIsInitialized(false);
			setShouldUseCache(false)
		});

	}, []);

	useEffect(() => {
		const initialize = async () => {
			if (isInitialized || !isLoggedIn || !api) return;

			console.log('Initializing container...');
			setIsInitialized(true);

			try {
				const cont = new DIContainer();
				const issuerResponse = await api.getExternalEntity('/issuer/all', undefined, true);
				const trustedCredentialIssuers = issuerResponse.data;

				const userResponse = await api.get('/user/session/account-info')
				const userData = userResponse.data;

				cont.register<IHttpProxy>('HttpProxy', HttpProxy);
				cont.register<IOpenID4VPRelyingPartyStateRepository>('OpenID4VPRelyingPartyStateRepository', OpenID4VPRelyingPartyStateRepository);

				cont.register<ICredentialParserRegistry>('CredentialParserRegistry', CredentialParserRegistry);

				cont.register<IOpenID4VCIClientStateRepository>('OpenID4VCIClientStateRepository', OpenID4VCIClientStateRepository, userData.settings.openidRefreshTokenMaxAgeInSeconds);
				cont.register<IOpenID4VCIHelper>('OpenID4VCIHelper', OpenID4VCIHelper, cont.resolve<IHttpProxy>('HttpProxy'));

				cont.register<CredentialBatchHelper>('CredentialBatchHelper', CredentialBatchHelper,
					async function updateCredential(storableCredential: StorableCredential) {
						await api.post('/storage/vc/update', {
							credential: storableCredential
						});
					}
				)
				const credentialParserRegistry = cont.resolve<ICredentialParserRegistry>('CredentialParserRegistry');

				credentialParserRegistry.addParser({
					async parse(rawCredential) {

						if (typeof rawCredential != 'string') {
							return { error: "rawCredential not of type 'string'" };

						}
						const result = await parseSdJwtCredential(rawCredential);
						if ('error' in result) {
							return { error: "Failed to parse sdjwt" };
						}
						let credentialConfigurationSupportedObj = null;
						const metadataResponse = await cont.resolve<IOpenID4VCIHelper>('OpenID4VCIHelper').getCredentialIssuerMetadata(isOnline, result.beautifiedForm.iss, shouldUseCache);
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
				});
				
				credentialParserRegistry.addParser({
					async parse(rawCredential) {

						if (typeof rawCredential != 'string') {
							return { error: "rawCredential not of type 'string'" };

						}
						
						const result = await parseJwtVcJsonCredential(rawCredential);
						
						if ('error' in result) {
							return { error: "Failed to parse jwt_vc_json" };
						}
						
						let iss = result.beautifiedForm.iss;

						// @todo: make less specific for SURF agent
						// this will no longer be needed if the issuer configuration is saved and includes the issuer URL
						if (iss.startsWith('did:web:')) {
							const issDomain = iss.split(':').pop();
							const domainParts = issDomain.split('.');
    					const domain = domainParts.slice(-3).join('.');
							const subDomain = domainParts.slice(0, -3).join('');
							iss = `https://agent.${domain}/${subDomain}`;
						}

						const metadataResponse = await cont.resolve<IOpenID4VCIHelper>('OpenID4VCIHelper').getCredentialIssuerMetadata(isOnline, iss, false);
						
						if (!metadataResponse) {
							return { error: 'No metadata response' };
						}

						const { metadata } = metadataResponse;

						if (!metadata) {
							return { error: 'No metadata' };
						}

						const supportedCredentialConfigurations = Object.values(metadata.credential_configurations_supported);

						if (! supportedCredentialConfigurations.every(configuration => configuration.format === VerifiableCredentialFormat.JWT_VC_JSON.toString())) {
							return { error: 'Credential parser can only parse jwt_vc_json format' };
						}

						// @todo: make more dynamic using schema from credential context
						const isOpenBadgeCredential = result.beautifiedForm.type.includes('OpenBadgeCredential');

						const credentialConfiguration: Record<string, any> = (Object.entries(metadata.credential_configurations_supported).find(([key]) => result.beautifiedForm.type.includes(key)) || []).pop() as unknown as Record<string, any>;
						const credentialFriendlyName = isOpenBadgeCredential
							? result.beautifiedForm.credentialSubject.achievement.name
							: result.beautifiedForm.name || credentialConfiguration?.display?.[0]?.name || 'Credential';

						if (credentialConfiguration) {
							const display =
								credentialConfiguration?.display?.find((d) => (d.locale || '').split('-')[0] === defaultLocale.split('-')[0]) ||
								credentialConfiguration?.display?.[0] ||
								{};

							let description = isOpenBadgeCredential
								? result.beautifiedForm.credentialSubject.achievement.description
								: result.beautifiedForm.description || display?.description || '';
							let logoURL = isOpenBadgeCredential
								? result.beautifiedForm.credentialSubject.achievement.image.id
								: display?.logo?.uri || null;
							let logoAltText = display?.logo?.alt_text || 'Credential logo';
							let backgroundColor = display?.background_color || '#808080';
							let textColor = display?.text_color || '#000000';
							let backgroundImageURL = display?.background_image?.uri || null;

							const svgCustomContent = await renderCustomSvgTemplate({
								beautifiedForm: result.beautifiedForm,
								name: credentialFriendlyName,
								description,
								logoURL,
								logoAltText,
								backgroundColor,
								textColor,
								backgroundImageURL,
							});

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
				});

				cont.register<IOpenID4VPRelyingParty>('OpenID4VPRelyingParty', OpenID4VPRelyingParty,
					cont.resolve<IOpenID4VPRelyingPartyStateRepository>('OpenID4VPRelyingPartyStateRepository'),
					cont.resolve<IHttpProxy>('HttpProxy'),
					cont.resolve<ICredentialParserRegistry>('CredentialParserRegistry'),
					cont.resolve<CredentialBatchHelper>('CredentialBatchHelper'),
					async function getAllStoredVerifiableCredentials() {
						const fetchAllCredentials = await api.get('/storage/vc');
						return { verifiableCredentials: fetchAllCredentials.data.vc_list };
					},

					async function signJwtPresentationKeystoreFn(nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> {
						return keystore.signJwtPresentation(nonce, audience, verifiableCredentials)
					},

					async function storeVerifiablePresentation(presentation: string, format: string, identifiersOfIncludedCredentials: string[], presentationSubmission: any, audience: string) {
						await api.post('/storage/vp', {
							presentationIdentifier: generateRandomIdentifier(32),
							presentation,
							presentationSubmission,
							includedVerifiableCredentialIdentifiers: identifiersOfIncludedCredentials,
							audience,
							issuanceDate: new Date().toISOString(),
						});
					}
				);

				cont.register<OpenID4VCIClientFactory>('OpenID4VCIClientFactory', OpenID4VCIClientFactory,
					cont.resolve<IHttpProxy>('HttpProxy'),
					cont.resolve<IOpenID4VCIClientStateRepository>('OpenID4VCIClientStateRepository'),
					async (requests: { nonce: string, audience: string, issuer: string }[]): Promise<{ proof_jwts: string[] }> => {
						const [{ proof_jwts }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs(requests);
						await api.updatePrivateData(newPrivateData);
						await keystoreCommit();
						return { proof_jwts };
					},
					async function storeCredentials(cList: StorableCredential[]) {
						await api.post('/storage/vc', {
							credentials: cList
						});
					},
				);

				const httpProxy = cont.resolve<IHttpProxy>('HttpProxy');
				const openID4VCIHelper = cont.resolve<IOpenID4VCIHelper>('OpenID4VCIHelper');

				const openID4VPRelyingParty = cont.resolve<IOpenID4VPRelyingParty>('OpenID4VPRelyingParty');

				let openID4VCIClientsJson: { [x: string]: IOpenID4VCIClient } = {};

				let clientConfigs: ClientConfig[] = await Promise.all(trustedCredentialIssuers.map(async (credentialIssuer) => {
					const [authorizationServerMetadata, credentialIssuerMetadata] = await Promise.all([
						openID4VCIHelper.getAuthorizationServerMetadata(isOnline, credentialIssuer.credentialIssuerIdentifier, shouldUseCache).catch((err) => null),
						openID4VCIHelper.getCredentialIssuerMetadata(isOnline, credentialIssuer.credentialIssuerIdentifier, shouldUseCache).catch((err) => null),
					]);
					if (!authorizationServerMetadata || !credentialIssuerMetadata) {
						console.error("Either authorizationServerMetadata or credentialIssuerMetadata could not be loaded");
						return null;
					}
					return {
						clientId: credentialIssuer.clientId,
						credentialIssuerIdentifier: credentialIssuer.credentialIssuerIdentifier,
						credentialIssuerMetadata: credentialIssuerMetadata.metadata,
						authorizationServerMetadata: authorizationServerMetadata.authzServeMetadata,
					}
				}));

				clientConfigs = clientConfigs.filter((conf) => conf != null);

				const openID4VCIClientFactory = cont.resolve<OpenID4VCIClientFactory>('OpenID4VCIClientFactory');

				for (const config of clientConfigs) {
					const openID4VCIClient = openID4VCIClientFactory.createClient(config);
					openID4VCIClientsJson[config.credentialIssuerIdentifier] = openID4VCIClient;
				}

				setContainer({
					openID4VCIClients: openID4VCIClientsJson,
					openID4VPRelyingParty,
					httpProxy,
					openID4VCIHelper,
					credentialParserRegistry,
				});

				setShouldUseCache(true);

			} catch (error) {
				console.error("Initialization failed:", error);
				setIsInitialized(false);
			}
		};

		initialize();
	}, [isLoggedIn, api, container, isInitialized, keystore, isOnline, shouldUseCache]);

	return (
		<ContainerContext.Provider value={container}>
			{children}
		</ContainerContext.Provider>
	);
}

export const withContainerContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<ContainerContextProvider>
			<Component {...props} />
		</ContainerContextProvider>
	);
export default ContainerContext;
