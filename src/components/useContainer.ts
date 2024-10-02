import { useEffect, useState, useContext, useMemo } from "react";
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
import { CredentialConfigurationSupported } from "../lib/schemas/CredentialConfigurationSupportedSchema";
import { generateRandomIdentifier } from "../lib/utils/generateRandomIdentifier";


export type ContainerContextValue = {
	httpProxy: IHttpProxy,
	openID4VPRelyingParty: IOpenID4VPRelyingParty,
	openID4VCIHelper: IOpenID4VCIHelper,
	openID4VCIClients: { [x: string]: IOpenID4VCIClient },
	credentialParserRegistry: ICredentialParserRegistry,
}


export function useContainer() {
	const { isLoggedIn, api, keystore } = useContext(SessionContext);

	const [trustedCredentialIssuers, setTrustedCredentialIssuers] = useState(null)

	const cont = new DIContainer();

	const [container, setContainer] = useState<ContainerContextValue>(null);

	useEffect(() => {
		api.getExternalEntity('/issuer/all').then((response) => {
			setTrustedCredentialIssuers(response.data)
		}).catch(err => {
			setTrustedCredentialIssuers([]);
		});
	}, []);

	async function initialize() {

		cont.register<IHttpProxy>('HttpProxy', HttpProxy);
		cont.register<IOpenID4VPRelyingPartyStateRepository>('OpenID4VPRelyingPartyStateRepository', OpenID4VPRelyingPartyStateRepository);

		cont.register<ICredentialParserRegistry>('CredentialParserRegistry', CredentialParserRegistry);

		cont.register<IOpenID4VCIClientStateRepository>('OpenID4VCIClientStateRepository', OpenID4VCIClientStateRepository);
		cont.register<IOpenID4VCIHelper>('OpenID4VCIHelper', OpenID4VCIHelper, cont.resolve<IHttpProxy>('HttpProxy'));
		const credentialParserRegistry = cont.resolve<ICredentialParserRegistry>('CredentialParserRegistry');

		credentialParserRegistry.addParser({
			async parse(rawCredential) {
				const result = await parseSdJwtCredential(rawCredential);
				if ('error' in result) {
					return { error: "Failed to parse sdjwt" };
				}

				try {
					const { metadata } = await cont.resolve<IOpenID4VCIHelper>('OpenID4VCIHelper').getCredentialIssuerMetadata(result.beautifiedForm.iss);
					const credentialConfigurationSupportedObj: CredentialConfigurationSupported = Object.values(metadata.credential_configurations_supported)
						.filter((x: any) => x?.vct && result.beautifiedForm?.vct && x.vct == result.beautifiedForm?.vct)
					[0];

					const credentialImageURL = credentialConfigurationSupportedObj.display[0] ? credentialConfigurationSupportedObj.display[0]?.background_image?.uri : undefined;
					const credentialFriendlyName = credentialConfigurationSupportedObj.display[0]?.name;
					return {
						beautifiedForm: result.beautifiedForm,
						credentialImageURL,
						credentialFriendlyName,
					}
				}
				catch (err) {
					return {
						beautifiedForm: result.beautifiedForm,
						credentialFriendlyName: "Credential",
						credentialImageURL: "/public/cred.png",
						// provide fallback credential metadata
					};
				}

			},
		});

		cont.register<IOpenID4VPRelyingParty>('OpenID4VPRelyingParty', OpenID4VPRelyingParty,
			cont.resolve<IOpenID4VPRelyingPartyStateRepository>('OpenID4VPRelyingPartyStateRepository'),
			cont.resolve<IHttpProxy>('HttpProxy'),
			cont.resolve<ICredentialParserRegistry>('CredentialParserRegistry'),
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
			async (cNonce: string, audience: string, clientId: string): Promise<{ jws: string }> => {
				const [{ proof_jwt }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProof(cNonce, audience, clientId);
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
				return { jws: proof_jwt };
			},
			async function storeCredential(c: StorableCredential) {
				await api.post('/storage/vc', {
					...c
				});
			},
		);


		const httpProxy = cont.resolve<IHttpProxy>('HttpProxy');
		const openID4VCIHelper = cont.resolve<IOpenID4VCIHelper>('OpenID4VCIHelper');

		const openID4VPRelyingParty = cont.resolve<IOpenID4VPRelyingParty>('OpenID4VPRelyingParty');

		let openID4VCIClientsJson: { [x: string]: IOpenID4VCIClient } = {};

		let clientConfigs: ClientConfig[] = await Promise.all(trustedCredentialIssuers.map(async (credentialIssuer) => {
			const [authorizationServerMetadata, credentialIssuerMetadata] = await Promise.all([
				openID4VCIHelper.getAuthorizationServerMetadata(credentialIssuer.credentialIssuerIdentifier).catch((err) => null),
				openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuer.credentialIssuerIdentifier).catch((err) => null),
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
		return { openID4VCIClientsJson, openID4VPRelyingParty, httpProxy, openID4VCIHelper, credentialParserRegistry };
	}

	useEffect(() => {
		if (isLoggedIn && trustedCredentialIssuers) {
			console.log("container instance created...");
			initialize().then(({ openID4VCIClientsJson, openID4VPRelyingParty, httpProxy, openID4VCIHelper, credentialParserRegistry }) => {
				setContainer({
					openID4VCIClients: openID4VCIClientsJson,
					openID4VPRelyingParty,
					httpProxy,
					openID4VCIHelper,
					credentialParserRegistry,
				});
			});
		}
	}, [isLoggedIn, trustedCredentialIssuers])

	return useMemo(() => {
		return { container }
	}, [isLoggedIn, trustedCredentialIssuers, container])
}
