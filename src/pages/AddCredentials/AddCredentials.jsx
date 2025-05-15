import React, { useState, useEffect, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { faMessageDots } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import OpenID4VCIContext from '@/context/OpenID4VCIContext';
import CredentialsContext from '@/context/CredentialsContext';

import useFilterItemByLang from '@/hooks/useFilterItemByLang';

import { useOpenID4VCIHelper } from '@/lib/services/OpenID4VCIHelper';

import Button from '@/components/Buttons/Button';
import Tooltip from '@/components/Shared/Tooltip';
import { H1 } from '@/components/Shared/Heading';
import RedirectPopup from '@/components/Popups/RedirectPopup';
import PageDescription from '@/components/Shared/PageDescription';
import QueryableList from '@/components/QueryableList/QueryableList';
import { buildCredentialConfiguration, getCredentialType } from '@/components/QueryableList/CredentialsDisplayUtils';

const AddCredentials = () => {
	//General
	const { t } = useTranslation();
	const filterItemByLang = useFilterItemByLang();
	const openID4VCIHelper = useOpenID4VCIHelper();
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);
	const { openID4VCI } = useContext(OpenID4VCIContext);
	const { vcEntityList, getData } = useContext(CredentialsContext);
	
	//State
	const [recent, setRecent] = useState([]);
	const [issuers, setIssuers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);
	const [credentialConfigurations, setCredentialConfigurations] = useState([]);
	const [selectedCredentialConfiguration, setSelectedCredentialConfiguration] = useState(null);

	//Effects
	useEffect(() => {
		if (vcEntityList === null) {
			getData();
		}
	}, [vcEntityList, getData]);

	useEffect(() => {
		const fetchRecentCredConfigs = async () => {
			vcEntityList.map(async (vcEntity, key) => {
				const identifierField = JSON.stringify([getCredentialType(vcEntity.parsedCredential), vcEntity.credentialIssuerIdentifier]);
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

	//Handlers
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

	const handleCredentialConfigurationClick = async (credentialConfigurationIdWithCredentialIssuerIdentifier) => {
		const [credentialConfigurationId] = JSON.parse(credentialConfigurationIdWithCredentialIssuerIdentifier);
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

	//Render
	return (
		<>	
			<div className="sm:px-12 pt-10 pb-20 w-full max-w-[1064px] mx-auto">
				<div className='flex items-center justify-between'>
					<div className='flex-1'>
						<h1 className="text-2xl font-semibold leading-tight tracking-tight text-c-lm-gray-900 md:text-3xl dark:text-c-dm-gray-100">
							{t('common.navItemAddCredentials')}
						</h1>

						<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
							{t('pageAddCredentials.description')}
						</p>
					</div>

					<div 
						id={`add-credential-tip`}
					>
						<FontAwesomeIcon 
							icon={faCircleQuestion} 
							className="text-c-lm-gray-700 dark:text-c-dm-gray-300 text-lg cursor-pointer hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 transition-all duration-150" 
						/>
					</div>
		
					<Tooltip 
					offset={8} 
					text="Use this page to add credentials to your wallet. You can add credentials from any issuer that supports OpenID for Verifiable Credentials." 
					id={`add-credential-tip`} 
					place="bottom"
					/>
				</div>

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
