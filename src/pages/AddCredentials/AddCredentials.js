import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '../../context/StatusContext';
import SessionContext from '../../context/SessionContext';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { H1 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import QueryableList from '../../components/QueryableList';
import ContainerContext from '../../context/ContainerContext';

const Issuers = () => {
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);
	const [issuers, setIssuers] = useState(null);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);
	const [selectedIssuer, setSelectedIssuer] = useState(null);
	const [loading, setLoading] = useState(false);
	const [availableCredentialConfigurations, setAvailableCredentialConfigurations] = useState(null);

	const container = useContext(ContainerContext);
	const { t } = useTranslation();

	useEffect(() => {
		const fetchIssuers = async () => {
			try {
				const response = await api.getExternalEntity('/issuer/all');
				let fetchedIssuers = response.data;
				fetchedIssuers = await Promise.all(fetchedIssuers.map(async (issuer) => {
					try {
						const metadata = (await container.openID4VCIHelper.getCredentialIssuerMetadata(issuer.credentialIssuerIdentifier)).metadata;
						return {
							...issuer,
							selectedDisplay: metadata?.display?.filter((display) => display.locale === 'en-US')[0] ? metadata.display.filter((display) => display.locale === 'en-US')[0] : null,
							credentialIssuerMetadata: metadata,
						}
					}
					catch (err) {
						console.error(err);
						return null;
					}

				}));
				fetchedIssuers = fetchedIssuers.filter((issuer) => issuer !== null);
				fetchedIssuers = fetchedIssuers.filter((issuer) => issuer.visible === 1); // show only visible issuers
				setIssuers(fetchedIssuers);
			} catch (error) {
				console.error('Error fetching issuers:', error);
			}
		};

		if (container) {
			fetchIssuers();
		}
	}, [api, container]);

	const handleIssuerClick = async (credentialIssuerIdentifier) => {
		const clickedIssuer = issuers.find((issuer) => issuer.credentialIssuerIdentifier === credentialIssuerIdentifier);
		if (clickedIssuer) {
			const cl = container.openID4VCIClients[credentialIssuerIdentifier];
			if (!cl) {
				return;
			}
			const confs = await cl.getAvailableCredentialConfigurations();
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
			const cl = container.openID4VCIClients[selectedIssuer.credentialIssuerIdentifier];
			const userHandleB64u = keystore.getUserHandleB64u();
			if (userHandleB64u == null) {
				console.error("Could not generate authorization request because user handle is null");
				return;
			}
			cl.generateAuthorizationRequest(selectedConfigurationId, userHandleB64u).then(({ url, client_id, request_uri }) => {
					window.location.href = url;
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
