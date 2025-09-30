import React, { useState, useEffect, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { H1 } from '../../components/Shared/Heading';
import QueryableList from '../../components/QueryableList/QueryableList';
import PageDescription from '../../components/Shared/PageDescription';
import EntityListItem from '@/components/QueryableList/EntityListItem';

const SendCredentials = () => {
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);

	const [verifiers, setVerifiers] = useState(null);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);
	const [selectedVerifier, setSelectedVerifier] = useState(null);
	const [loading, setLoading] = useState(false);
	const { t } = useTranslation();

	const getUser = () => {
		const userHandle = keystore.getUserHandleB64u();
		if (!userHandle) {
			return null;
		}
		const u = keystore.getCachedUsers().filter((user) => user.userHandleB64u === userHandle)[0];
		return u;
	}

	const syncPrivateData = async () => {
		const cachedUser = getUser();
		if (!cachedUser) {
			throw new Error("Could not get cached user");
		}
		const result = await api.syncPrivateData(cachedUser);
		console.log("Result: ", result)
		if (!result.ok) {
			throw new Error("PrivateData needs synchronization");
		}
		return {};
	}

	useEffect(() => {
		const fetchVerifiers = async () => {
			try {
				const fetchedVerifiers = await api.getAllVerifiers();
				setVerifiers(fetchedVerifiers);
			} catch (error) {
				console.error('Error fetching verifiers:', error);
			}
		};

		fetchVerifiers();
	}, [api]);

	const handleVerifierClick = async (id) => {
		const clickedVerifier = verifiers.find((verifier) => verifier.id === id);
		if (clickedVerifier) {
			setSelectedVerifier(clickedVerifier);
			setShowRedirectPopup(true);
		}
	};

	const handleCancel = () => {
		setShowRedirectPopup(false);
		setSelectedVerifier(null);
	};

	const handleContinue = () => {
		syncPrivateData().then(() => {
			setLoading(true);

			console.log('Continue with:', selectedVerifier);

			if (selectedVerifier) {
				window.location.href = selectedVerifier.url;
			}

			setLoading(false);
			setShowRedirectPopup(false);
		}).catch((err) => console.error(err));
	};

	return (
		<>
			<div className="px-6 sm:px-12 w-full">
				<H1 heading={t('common.navItemSendCredentials')} />
				<PageDescription description={t('pageSendCredentials.description')} />

				{verifiers && (
					<QueryableList
						isOnline={isOnline}
						list={verifiers.map((verifier) => ({
							...verifier,
							displayNode: (searchQuery) => (
								<EntityListItem
									primaryData={{
										name: verifier.name,
									}}
									searchQuery={searchQuery}
								/>
							),
						}))}
						queryField="name"
						translationPrefix="pageSendCredentials"
						identifierField="id"
						onClick={handleVerifierClick}
					/>

				)}
			</div>

			{showRedirectPopup && (
				<RedirectPopup
					loading={loading}
					onClose={handleCancel}
					handleContinue={handleContinue}
					popupTitle={`${t('pageSendCredentials.popup.title')} ${selectedVerifier?.name}`}
					popupMessage={
						<Trans
							i18nKey="pageSendCredentials.popup.message"
							values={{ verifierName: selectedVerifier?.name ?? "Unknown" }}
							components={{ strong: <strong /> }}
						/>
					}
				/>
			)}
		</>
	);
};

export default SendCredentials;
