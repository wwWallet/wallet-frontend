// External libraries
import React, { useContext } from 'react';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts
import CredentialsContext from '@/context/CredentialsContext';
import AppSettingsContext from "@/context/AppSettingsContext";
import { useTenant } from '@/context/TenantContext';

// Hooks
import useScreenType from '../../hooks/useScreenType';

// Components
import { H1 } from '../../components/Shared/Heading';
import AddCredentialCard from '../../components/Credentials/AddCredentialCard';
import HistoryList from '../../components/History/HistoryList';
import Slider from '../../components/Shared/Slider';
import { CredentialCardSkeleton } from '@/components/Skeletons';
import CredentialGridCard from '@/components/Credentials/CredentialGridCard';
import CredentialSlideCard from '@/components/Credentials/CredentialSlideCard';

import ViewSelect from '@/components/Credentials/ViewSelect';

import VerticalSlider from '@/components/Shared/VerticalSlider';
import PendingTransactionsBanner from '@/components/Credentials/PendingTransactionsBanner';

const Home = () => {
	const { vcEntityList, latestCredentials, currentSlide, setCurrentSlide, pendingTransactions } = useContext(CredentialsContext);
	const { settings, setMobileVcHomeView } = useContext(AppSettingsContext);
	const { buildPath } = useTenant();
	const screenType = useScreenType();

	const mobileVcHomeView = settings.mobileVcHomeView;

	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleAddCredential = () => {
		navigate(buildPath('add'));
	};

	const handleImageClick = (vcEntity) => {
		navigate(buildPath(`credential/${vcEntity.batchId}`));
	};

	const setView = (v) => {
		setMobileVcHomeView(v);
	};

	return (
		<>
			<div className="w-full">
				<div className="px-6 sm:px-12">
					<div className='flex items-center justify-between gap-3'>
						<H1 heading={t('common.navItemCredentials')} />
						{screenType !== "desktop" && vcEntityList?.length > 1 && (
							<ViewSelect value={mobileVcHomeView} onChange={(v) => setView(v)} />
						)}
					</div>
					<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
					{(pendingTransactions?.length > 0) && (
						<PendingTransactionsBanner
							pendingTransactions={pendingTransactions}
							onView={() => navigate(buildPath('pending'))}
						/>
					)}
				</div>
				{vcEntityList ? (
					<div className=''>
						{vcEntityList.length === 0 ? (
							<div className="py-4 md:py-2 overflow-x-hidden">
								<div className={`${screenType !== 'desktop' ? 'xm:px-6 px-8 sm:px-20' : 'px-12 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3'} `}>
									<AddCredentialCard onClick={handleAddCredential} />
								</div>
							</div>
						) : (
							<>
								{screenType !== 'desktop' ? (
									<>
										{(mobileVcHomeView === 'horizontal-slider') ? (
											<div className='py-4 overflow-hidden'>
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
													className='w-full px-8 xm:px-6 sm:px-20'
												/>
												{vcEntityList[currentSlide - 1] && (
													<div className='px-6'>
														<HistoryList
															batchId={vcEntityList[currentSlide - 1].batchId}
															title="Recent History"
															limit={3}
														/>
													</div>
												)}
											</div>
										) : mobileVcHomeView === 'vertical-slider' ? (
											<div className='py-2 px-6 xm:px-4 sm:px-4'>
												<VerticalSlider
													items={vcEntityList}
													initialIndex={currentSlide - 1}
													onSlideChange={(i) => setCurrentSlide(i + 1)}
													renderSlideContent={(vcEntity, i) => (
														<CredentialSlideCard
															key={vcEntity.batchId}
															vcEntity={vcEntity}
															isActive={currentSlide === i + 1}
															latestCredentials={latestCredentials}
															onClick={handleImageClick}
														/>
													)}
												/>
											</div>
										) : mobileVcHomeView === 'list' && (
											<>
												<div className="xm:px-6 sm:px-20 grid gap-4 grid-cols-1 py-4 px-6">
													{vcEntityList && vcEntityList.map((vcEntity) => (
														<CredentialGridCard
															key={vcEntity.batchId}
															vcEntity={vcEntity}
															latestCredentials={latestCredentials}
															onClick={handleImageClick}
														/>
													))}
												</div>
											</>
										)}
									</>
								) : (
									<div className="px-6 sm:px-12 py-2 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3">
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
					<div className="py-4 md:py-2 overflow-x-hidden">
						<div className={`${screenType !== 'desktop' ? 'xm:px-6 px-8 sm:px-20' : 'px-12 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3'} `}>
							{Array.from({ length: screenType !== 'desktop' ? 1 : 6 }).map((_, idx) => (
								<CredentialCardSkeleton key={idx} />
							))}
						</div>
					</div>
				)}
			</div >
		</>
	);
}

export default Home;
