// External libraries
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

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
import { CredentialCardSkeleton } from '@/components/Skeletons';
import CredentialGridCard from '@/components/Credentials/CredentialGridCard';
import CredentialSlideCard from '@/components/Credentials/CredentialSlideCard';

const Home = () => {
	const { vcEntityList, latestCredentials, getData, currentSlide, setCurrentSlide } = useContext(CredentialsContext);
	const { keystore } = useContext(SessionContext);
	const screenType = useScreenType();

	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.batchId}`);
	};

	return (
		<>
			<div className="sm:px-6 w-full">
				<div className='px-6'>
				<H1 heading={t('common.navItemCredentials')} />
				{screenType !== 'mobile' && (
					<p className="italic pd-2 text-gray-700 dark:text-gray-300">{t('pageCredentials.description')}</p>
				)}
				</div>
				{vcEntityList ? (
					<div className='my-4 p-2 px-8 overflow-x-hidden'>
						{vcEntityList.length === 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-20">
								<AddCredentialCard onClick={handleAddCredential} />
							</div>
						) : (
							<>
								{screenType !== 'desktop' ? (
									<>
										<div className='xm:px-4 px-12'>
											<Slider
												items={vcEntityList}
												renderSlideContent={(vcEntity, index) => (
													<CredentialSlideCard
														key={vcEntity.batchId}
														vcEntity={vcEntity}
														isActive={currentSlide === index + 1}
														latestCredentials={latestCredentials}
														onClick={handleImageClick}
													/>
												)}
												initialSlide={currentSlide}
												onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
											/>

											{/* Update HistoryList based on current slide */}
											{vcEntityList[currentSlide - 1] && (
												<HistoryList
													batchId={vcEntityList[currentSlide - 1].batchId}
													title="Recent History"
													limit={3}
												/>
											)}
										</div>
									</>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3">
										{vcEntityList && vcEntityList.map((vcEntity) => (
											<CredentialGridCard
												key={vcEntity.batchId}
												vcEntity={vcEntity}
												latestCredentials={latestCredentials}
												onClick={handleImageClick}
											/>
										))}
										<AddCredentialCard onClick={handleAddCredential} />
									</div>
								)}
							</>
						)}
					</div>
				) : (
					<div className="my-4 p-8 overflow-x-hidden">
						<div className={`${screenType !== 'desktop' ? 'xm:px-4 px-12 sm:px-20' : 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3'} `}>
							{Array.from({ length: screenType !== 'desktop' ? 1 : 6 }).map((_, idx) => (
								<CredentialCardSkeleton key={idx} />
							))}
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default Home;
