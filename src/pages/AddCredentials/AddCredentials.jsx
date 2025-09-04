import React, { useState, useEffect, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { H1 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import QueryableList from '../../components/QueryableList/QueryableList';
import { useOpenID4VCIHelper } from '../../lib/services/OpenID4VCIHelper';
import OpenID4VCIContext from '@/context/OpenID4VCIContext';
import CredentialsContext from '@/context/CredentialsContext';
import useFilterItemByLang from '@/hooks/useFilterItemByLang';
import { buildCredentialConfiguration } from '@/components/QueryableList/CredentialsDisplayUtils';

const AddCredentials = () => {
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
	const [cachedUser, setCachedUser] = useState(null);

	useEffect(() => {
		if (!keystore) {
			return;
		}

		const userHandle = keystore.getUserHandleB64u();
		if (!userHandle) {
			return;
		}
		const u = keystore.getCachedUsers().filter((user) => user.userHandleB64u === userHandle)[0];
		if (u) {
			setCachedUser(u);
		}
	}, [keystore, setCachedUser]);

	useEffect(() => {
		if (vcEntityList === null) {
			getData();
		}
	}, [vcEntityList, getData]);

	useEffect(() => {
		const fetchRecentCredConfigs = async () => {
			vcEntityList.map(async (vcEntity, key) => {
				const identifierField = JSON.stringify([vcEntity.credentialConfigurationId, vcEntity.credentialIssuerIdentifier]);
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

	const getSelectedIssuerDisplay = () => {
		const selectedIssuer = getSelectedIssuer();

		if (selectedIssuer) {
			const selectedDisplayBasedOnLang = filterItemByLang(selectedIssuer.display, 'locale')
			if (selectedDisplayBasedOnLang) {
				const { name, description } = selectedDisplayBasedOnLang;
				return { name, description };
			}
		}
		return null;
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

						Object.keys(configs).forEach((key) => {
							const credentialConfiguration = buildCredentialConfiguration(key, configs[key], metadata, filterItemByLang);
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

		if (openID4VCIHelper && openID4VCI && filterItemByLang) {
			console.log("Fetching issuers...")
			fetchIssuers();
		}
	}, [api, isOnline, openID4VCIHelper, openID4VCI, filterItemByLang]);

	const handleCredentialConfigurationClick = async (credentialConfigurationIdWithCredentialIssuerIdentifier) => {
		const result = await api.syncPrivateData(cachedUser);
		if (!result.ok) {
			return {};
		}
		const [credentialConfigurationId, credentialIssuerIdentifier] = JSON.parse(credentialConfigurationIdWithCredentialIssuerIdentifier);
		const clickedCredentialConfiguration = credentialConfigurations.find((conf) => conf.credentialConfigurationId === credentialConfigurationId && conf.credentialIssuerIdentifier === credentialIssuerIdentifier);
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
			<div className="px-6 sm:px-12 w-full">
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

			{showRedirectPopup && selectedCredentialConfiguration && (
				<RedirectPopup
					loading={loading}
					onClose={handleCancel}
					handleContinue={handleContinue}
					popupTitle={`${t('pageAddCredentials.popup.title')} ${selectedCredentialConfiguration?.credentialConfigurationDisplayName}`}
					popupMessage={
						<Trans
							i18nKey="pageAddCredentials.popup.message"
							values={{
								issuerName: getSelectedIssuerDisplay()?.name ?? "Unknown",
								issuerDescription: getSelectedIssuerDisplay()?.description ? `(${getSelectedIssuerDisplay()?.description})` : "",
								credentialName: selectedCredentialConfiguration?.credentialDisplay.name ?? "Unknown",
								credentialDescription: selectedCredentialConfiguration?.credentialDisplay?.description ? `(${selectedCredentialConfiguration?.credentialDisplay?.description})` : "",
							}}
							components={{ strong: <strong />, italic: <i /> }}
						/>
					}
				/>
			)}
		</>
	);
};

export default AddCredentials;
