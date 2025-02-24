// External libraries
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';
import useScreenType from '../../hooks/useScreenType';

// Components
import { H1 } from '../../components/Shared/Heading';
import CredentialImage from '../../components/Credentials/CredentialImage';
import AddCredentialCard from '../../components/Credentials/AddCredentialCard';
import HistoryList from '../../components/History/HistoryList';
import Slider from '../../components/Shared/Slider';

const Home = () => {
	const { vcEntityList, latestCredentials, getData, currentSlide, setCurrentSlide } = useContext(CredentialsContext);
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api);
	const screenType = useScreenType();

	const navigate = useNavigate();
	const { t } = useTranslation();
	useEffect(() => {
		getData();
	}, [getData]);

	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.credentialIdentifier}`);
	};

	const renderSlideContent = (vcEntity) => (
		<button
			key={vcEntity.id}
			className={`relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'fade-in' : ''}`}
			onClick={() => { handleImageClick(vcEntity); }}
			aria-label={`${vcEntity.parsedCredential.credentialFriendlyName}`}
			tabIndex={currentSlide !== vcEntityList.indexOf(vcEntity) + 1 ? -1 : 0}
			title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: vcEntity.parsedCredential.credentialFriendlyName })}
		>
			<CredentialImage
				vcEntity={vcEntity}
				vcEntityInstances={vcEntity.instances}
				showRibbon={currentSlide === vcEntityList.indexOf(vcEntity) + 1}
				parsedCredential={vcEntity.parsedCredential}
				className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`}
			/>
		</button>
	);

	return (
		<>
			<div className="sm:px-6 w-full">
				<H1 heading={t('common.navItemCredentials')} />
				{screenType !== 'mobile' && (
					<p className="italic pd-2 text-gray-700 dark:text-gray-300">{t('pageCredentials.description')}</p>
				)}
				{vcEntityList && (
					<div className='my-4 p-2 overflow-x-hidden'>
						{vcEntityList.length === 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
								<AddCredentialCard onClick={handleAddCredential} />
							</div>
						) : (
							<>
								{screenType !== 'desktop' ? (
									<>
										<div className='xm:px-4 px-12 sm:px-20'>
											<Slider
												items={vcEntityList}
												renderSlideContent={renderSlideContent}
												initialSlide={currentSlide}
												onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
											/>

											{/* Update HistoryList based on current slide */}
											{vcEntityList[currentSlide - 1] && (
												<HistoryList
													credentialId={vcEntityList[currentSlide - 1].credentialIdentifier}
													history={history}
													title="Recent History"
													limit={3}
												/>
											)}
										</div>
									</>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3">
										{vcEntityList && vcEntityList.map((vcEntity) => (
											<button
												key={vcEntity.id}
												className={`relative rounded-xl transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'highlight-border fade-in' : ''}`}
												onClick={() => handleImageClick(vcEntity)}
												aria-label={`${vcEntity.parsedCredential.credentialFriendlyName}`}
												title={t('pageCredentials.credentialDetailsTitle', { friendlyName: vcEntity.parsedCredential.credentialFriendlyName })}
											>
												<CredentialImage
													vcEntity={vcEntity}
													vcEntityInstances={vcEntity.instances}
													parsedCredential={vcEntity.parsedCredential}
													className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`}
												/>
											</button>
										))}
										<AddCredentialCard onClick={handleAddCredential} />
									</div>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</>
	);
}

export default Home;
