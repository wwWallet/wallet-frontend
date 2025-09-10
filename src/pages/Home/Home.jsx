// External libraries
import React, { useContext, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { BsFillGrid1X2Fill } from "react-icons/bs";
import { BiSolidCarousel } from "react-icons/bi";
import { BsSubstack } from "react-icons/bs";

// Contexts
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';

// Hooks
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

import { useLocalStorage } from '@/hooks/useStorage';

import ViewSelect from '@/components/Credentials/ViewSelect';

import VerticalSlider from '@/components/Shared/VerticalSlider';

const Home = () => {
	const { vcEntityList, latestCredentials, getData, currentSlide, setCurrentSlide } = useContext(CredentialsContext);
	const { api, keystore } = useContext(SessionContext);
	const screenType = useScreenType();

	const [viewOpen, setViewOpen] = useState(false);
	const [mobileView, setMobileView,] = useLocalStorage('mobileView', 'horizontal-slider');

	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.batchId}`);
	};

	const setView = (v) => {
		setMobileView(v);
		setViewOpen(false);
	};
	return (
		<>
			<div className="sm:px-6 w-full">
				<div className="px-6">
					<div className='flex items-center justify-between gap-3'>
						<H1 heading={t('common.navItemCredentials')} />
						{screenType !== "desktop" && (
							<ViewSelect value={mobileView} onChange={(v) => setView(v)} />
						)}
					</div>
					<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
				</div>
				{vcEntityList ? (
					<div className=''>
						{vcEntityList.length === 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-20">
								<AddCredentialCard onClick={handleAddCredential} />
							</div>
						) : (
							<>
								{screenType !== 'desktop' ? (
									<>
										{(mobileView === 'horizontal-slider') ? (
											<div className='py-4 overflow-x-hidden'>
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
													{vcEntityList[currentSlide - 1] && (
														<div className='px-2'>
															<HistoryList
																batchId={vcEntityList[currentSlide - 1].batchId}
																title="Recent History"
																limit={3}
															/>
														</div>
													)}
												</div>
											</div>
										) : mobileView === 'vertical-slider' ? (
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
										) : mobileView === 'list' && (
											<>
												<div className="grid gap-4 grid-cols-1 py-4 px-6">
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
			</div >
		</>
	);
}

export default Home;
