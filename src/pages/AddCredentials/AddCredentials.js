import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '../../context/StatusContext';
import SessionContext from '../../context/SessionContext';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { H1 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import QueryableList from '../../components/QueryableList';
import { useOpenID4VCIHelper } from '../../lib/services/OpenID4VCIHelper';
import OpenID4VCIContext from '../../context/OpenID4VCIContext';

const Issuers = () => {
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);
	const [issuers, setIssuers] = useState([]);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);
	const [selectedIssuer, setSelectedIssuer] = useState(null);
	const [loading, setLoading] = useState(false);
	const [availableCredentialConfigurations, setAvailableCredentialConfigurations] = useState(null);

	const openID4VCIHelper = useOpenID4VCIHelper();
	const { openID4VCI } = useContext(OpenID4VCIContext);

	const { t } = useTranslation();

	useEffect(() => {
		const fetchIssuers = async () => {
			try {
				const response = await api.getExternalEntity('/issuer/all', undefined, true);
				let fetchedIssuers = response.data;
				fetchedIssuers.map(async (issuer) => {
					try {
						const metadata = (await openID4VCIHelper.getCredentialIssuerMetadata(issuer.credentialIssuerIdentifier)).metadata;
						const issuerObject = {
							...issuer,
							selectedDisplay: metadata?.display?.filter((display) => display.locale === 'en-US')[0] ? metadata.display.filter((display) => display.locale === 'en-US')[0] : null,
							credentialIssuerMetadata: metadata,
						};

						if (issuerObject.visible) {
							setIssuers((currentArray) => {
								if (currentArray.filter((iss) => iss.credentialIssuerMetadata.credential_issuer == issuerObject.credentialIssuerMetadata.credential_issuer).length == 0) {
									return [...currentArray, issuerObject];
								}
								return [...currentArray];
							});
						}
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

		if (openID4VCIHelper) {
			console.log("Fetching issuers...")
			fetchIssuers();
		}
	}, [api, isOnline]);

	const handleIssuerClick = async (credentialIssuerIdentifier) => {
		const clickedIssuer = issuers.find((issuer) => issuer.credentialIssuerIdentifier === credentialIssuerIdentifier);
		if (clickedIssuer) {
			const confs = await openID4VCI.getAvailableCredentialConfigurations(credentialIssuerIdentifier);
			setAvailableCredentialConfigurations(confs);
			setSelectedIssuer(clickedIssuer);
			setShowRedirectPopup(true);
		}
	};

	const handleCancel = () => {
		setShowRedirectPopup(false);
		setSelectedIssuer(null);
	};

	const handleContinue = (selectedConfigurationId) => {
		setLoading(true);

		if (selectedIssuer && selectedIssuer.credentialIssuerIdentifier) {
			const userHandleB64u = keystore.getUserHandleB64u();
			if (userHandleB64u == null) {
				console.error("Could not generate authorization request because user handle is null");
				return;
			}
			openID4VCI.generateAuthorizationRequest(selectedIssuer.credentialIssuerIdentifier, selectedConfigurationId).then((result) => {
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

				{issuers && (
					<QueryableList
						isOnline={isOnline}
						list={issuers}
						queryField='selectedDisplay.name'
						translationPrefix='pageAddCredentials'
						identifierField='credentialIssuerIdentifier'
						onClick={handleIssuerClick}
					/>
				)}
			</div>

			{showRedirectPopup && (
				<RedirectPopup
					loading={loading}
					onClose={handleCancel}
					handleContinue={handleContinue}
					availableCredentialConfigurations={availableCredentialConfigurations}
					popupTitle={`${t('pageAddCredentials.popup.title')} ${selectedIssuer?.selectedDisplay?.name ?? "Unknown"}`}
					popupMessage={t('pageAddCredentials.popup.message', { issuerName: selectedIssuer?.selectedDisplay?.name ?? "Unknown" })}
				/>
			)}
		</>
	);
};

export default Issuers;
