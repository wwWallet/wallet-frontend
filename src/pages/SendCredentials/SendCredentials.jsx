import React, { useState, useEffect, useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { H1 } from '../../components/Shared/Heading';
import QueryableList from '../../components/QueryableList/QueryableList';
import PageDescription from '../../components/Shared/PageDescription';
import EntityListItem from '@/components/QueryableList/EntityListItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';
import Tooltip from '@/components/Shared/Tooltip';

const SendCredentials = () => {
	//General
	const { t } = useTranslation();
	const { api } = useContext(SessionContext);
	const { isOnline } = useContext(StatusContext);

	//State
	const [loading, setLoading] = useState(false);
	const [verifiers, setVerifiers] = useState(null);
	const [selectedVerifier, setSelectedVerifier] = useState(null);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);

	//Effects
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

	//Handlers
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
		setLoading(true);

		console.log('Continue with:', selectedVerifier);

		if (selectedVerifier) {
			window.location.href = selectedVerifier.url;
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
							{t('common.navItemSendCredentials')}
						</h1>

						<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
							{t('pageSendCredentials.description')}
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
					text="Use this page to send your credentials to a verifier. You can send credentials to any verifier that supports OpenID for Verifiable Credentials." 
					id={`add-credential-tip`} 
					place="bottom"
					/>
				</div>

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
