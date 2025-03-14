import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { H1 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import QueryableList from '../../components/QueryableList';
import { useOpenID4VCIHelper } from '../../lib/services/OpenID4VCIHelper';
import OpenID4VCIContext from '@/context/OpenID4VCIContext';
import CredentialsContext from '@/context/CredentialsContext';
import useFilterItemByLang from '@/hooks/useFilterItemByLang';

const Issuers = () => {
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);
	const [issuers, setIssuers] = useState([]);
	const [recent, setRecent] = useState([]);
	const [credentialConfigurations, setCredentialConfigurations] = useState([]);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);

	const [selectedCredentialConfiguration, setSelectedCredentialConfiguration] = useState(null);
	const [loading, setLoading] = useState(false);

	const openID4VCIHelper = useOpenID4VCIHelper();
	const { openID4VCI } = useContext(OpenID4VCIContext);
	const { vcEntityList, getData } = useContext(CredentialsContext);

	const { t } = useTranslation();
	const filterItemByLang = useFilterItemByLang();

	useEffect(() => {
		if (vcEntityList === null) {
			getData();
		}
	}, [vcEntityList, getData]);

	const getCredentialType = (parsedCredential) => parsedCredential.metadata.credential.vct ?? parsedCredential.metadata.credential.doctype ?? "";

	useEffect(() => {
		const fetchRecentCredConfigs = async () => {
			vcEntityList.map(async (vcEntity, key) => {
				const identifierField = getCredentialType(vcEntity.parsedCredential) + '-' + vcEntity.credentialIssuerIdentifier;
				setRecent((currentArray) => {
					const recentRecordExists = currentArray.some((rec) =>
						rec === identifierField
					);

					if (!recentRecordExists) {
						return [...currentArray, identifierField];
					}
					return currentArray;
				});

			})
		};

		if (vcEntityList) {
			console.log("Fetching Recent Credential Configurations...")
			fetchRecentCredConfigs();
		}
	}, [vcEntityList]);

	const getSelectedIssuer = () => {
		if (selectedCredentialConfiguration) {
			const { credentialIssuerIdentifier } = selectedCredentialConfiguration;
			return issuers.filter((issuer) => issuer.credential_issuer === credentialIssuerIdentifier)[0];
		}
		return null;
	}

	const getIssuerDisplayMetadata = (issuerMetadata) => {
		const selectedDisplayBasedOnLang = filterItemByLang(issuerMetadata.display, 'locale')
		if (selectedDisplayBasedOnLang) {
			const { name, logo } = selectedDisplayBasedOnLang;
			return { name, logo };
		}
		return { name: new URL(issuerMetadata.credential_issuer).host, logo: null };
	}

	const getSelectedIssuerDisplay = () => {
		const selectedIssuer = getSelectedIssuer();
		console.log("Selected issuer ", selectedIssuer)

		if (selectedIssuer) {
			const selectedDisplayBasedOnLang = filterItemByLang(selectedIssuer.display, 'locale')
			if (selectedDisplayBasedOnLang) {
				const { name, logo } = selectedDisplayBasedOnLang;
				return { name, logo };
			}
		}
		return null;
	}

	const getCredentialConfigurationDisplay = (credentialConfigurationId, credentialConfiguration) => {
		if (credentialConfiguration?.display && credentialConfiguration?.display.length > 0) {
			const display = filterItemByLang(credentialConfiguration?.display, 'locale');
			return { name: display?.name ?? credentialConfigurationId, logo: display.logo };
		}
		else {
			return { name: credentialConfigurationId, logo: null };
		}
	}

	useEffect(() => {
		const fetchIssuers = async () => {
			try {
				const response = await api.getExternalEntity('/issuer/all', undefined, true);
				let fetchedIssuers = response.data;
				fetchedIssuers.map(async (issuer) => {
					try {
						if (!issuer.visible) {
							return;
						}
						const metadata = (await openID4VCIHelper.getCredentialIssuerMetadata(issuer.credentialIssuerIdentifier)).metadata;
						const configs = await openID4VCI.getAvailableCredentialConfigurations(issuer.credentialIssuerIdentifier);


						// add issuer
						setIssuers((currentArray) => {
							const issuerExists = currentArray.some((issuerMetadata) =>
								issuerMetadata.credential_issuer === metadata.credential_issuer
							);

							if (!issuerExists) {
								return [...currentArray, metadata];
							}
							return currentArray;
						});


						Object.keys(configs).forEach(key => {
							const config = configs[key];

							const credentialConfiguration = {
								identifierField: `${key}-${metadata.credential_issuer}`,
								credentialConfigurationDisplayName: `${getCredentialConfigurationDisplay(key, config).name} (${getIssuerDisplayMetadata(metadata)?.name})` ?? key,

								credentialConfigurationId: key,
								credentialIssuerIdentifier: metadata.credential_issuer,
								credentialConfiguration: config,
							};


							setCredentialConfigurations((currentArray) => {
								const credentialConfigurationExists = currentArray.some(({ credentialConfigurationId, credentialIssuerIdentifier, credentialConfiguration }) =>
									credentialConfigurationId === key && credentialIssuerIdentifier === metadata.credential_issuer
								);
								if (!credentialConfigurationExists) {
									return [...currentArray, credentialConfiguration];
								}
								return currentArray;
							})
						});

					}
					catch (err) {
						console.error(err);
						return null;
					}
				})
			} catch (error) {
				console.error('Error fetching issuers:', error);
			}
		};

		if (openID4VCIHelper && openID4VCI) {
			console.log("Fetching issuers...")
			fetchIssuers();
		}
	}, [api, isOnline, openID4VCIHelper, openID4VCI]);

	const handleCredentialConfigurationClick = async (credentialConfigurationIdWithCredentialIssuerIdentifier) => {
		const [credentialConfigurationId] = credentialConfigurationIdWithCredentialIssuerIdentifier.split('-');
		const clickedCredentialConfiguration = credentialConfigurations.find((conf) => conf.credentialConfigurationId === credentialConfigurationId);
		if (clickedCredentialConfiguration) {
			setSelectedCredentialConfiguration(clickedCredentialConfiguration);
			setShowRedirectPopup(true);
		}
	}

	const handleCancel = () => {
		setShowRedirectPopup(false);
		setSelectedCredentialConfiguration(null);
	};

	const handleContinue = () => {
		setLoading(true);

		if (selectedCredentialConfiguration) {
			const { credentialConfigurationId, credentialIssuerIdentifier } = selectedCredentialConfiguration;

			const userHandleB64u = keystore.getUserHandleB64u();
			if (userHandleB64u == null) {
				console.error("Could not generate authorization request because user handle is null");
				return;
			}
			openID4VCI.generateAuthorizationRequest(credentialIssuerIdentifier, credentialConfigurationId).then((result) => {
				if ('url' in result) {
					const { url } = result;
					window.location.href = url;
				}
			}).catch((err) => {
				console.error(err)
				console.error("Couldn't generate authz req")
			});
		}

		setLoading(false);
		setShowRedirectPopup(false);
	};

	return (
		<>
			<div className="sm:px-6 w-full">
				<H1 heading={t('common.navItemAddCredentials')} />
				<PageDescription description={t('pageAddCredentials.description')} />

				{credentialConfigurations && recent && (
					<QueryableList
						isOnline={isOnline}
						list={credentialConfigurations}
						recent={recent}
						queryField='credentialConfigurationDisplayName'
						translationPrefix='pageAddCredentials'
						identifierField='identifierField'
						onClick={handleCredentialConfigurationClick}
					/>
				)}
			</div>

			{showRedirectPopup && (
				<RedirectPopup
					loading={loading}
					onClose={handleCancel}
					handleContinue={handleContinue}
					popupTitle={`${t('pageAddCredentials.popup.title')} ${getSelectedIssuerDisplay()?.name ?? "Unknown"}`}
					popupMessage={t('pageAddCredentials.popup.message', { issuerName: getSelectedIssuerDisplay()?.name ?? "Unknown" })}
				/>
			)}
		</>
	);
};

export default Issuers;
