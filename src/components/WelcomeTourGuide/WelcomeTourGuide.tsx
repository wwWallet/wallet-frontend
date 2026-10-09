import React, { useState, useEffect } from 'react';
import Tour from 'reactour';
import type { ReactourStep } from 'reactour';
import { useTranslation } from 'react-i18next';

import useScreenType from '../../hooks/useScreenType';
import { useSessionContext } from '@/context/SessionContext';

import WelcomeModal from './WecomeModal';
import Button from '../Buttons/Button';

interface TourGuideProps {
	toggleMenu: () => void;
	isOpen: boolean;
}

const TourGuide = ({ toggleMenu, isOpen }: TourGuideProps) => {
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(true);
	const [steps, setSteps] = useState<ReactourStep[]>([]);
	const { api } = useSessionContext();
	const { authenticationType, showWelcome } = api.getSession();
	const { t } = useTranslation();
	const screenType = useScreenType();

	useEffect(() => {

		const getStepSelectorSmallScreen = (stepName: string) => {
			if (screenType !== 'desktop') {
				return stepName + '-small-screen';
			} else {
				return stepName;
			}
		};
		const commonSteps: ReactourStep[] = [
			{
				selector: '.step-1',
				content: <p className='text-lm-gray-900'>{t("tourGuide.tourStep1")}</p>,
				stepInteraction: false,
			},
			{
				selector: getStepSelectorSmallScreen('.step-2'),
				content: <p className='text-lm-gray-900'>{t("tourGuide.tourStep2")}</p>,
			},
			{
				selector: getStepSelectorSmallScreen('.step-3'),
				content: <p className='text-lm-gray-900'>{t("tourGuide.tourStep3")}</p>,
			},
			...(screenType !== 'desktop' ? [{
				selector: '.step-4',
				content: <p className='text-lm-gray-900'>{t("tourGuide.tourStep4")}</p>,
			}] : []),
			{
				selector: getStepSelectorSmallScreen('.step-5'),
				content: <p className='text-lm-gray-900'>{t("tourGuide.tourStep5")}</p>,
			},
			{
				selector: '.step-6',
				content: <p className='text-lm-gray-900'>{t("tourGuide.tourStep6")}</p>,
			},
			{
				content: () => (
					<>
						<p className='mt-2 text-lm-gray-900'>{t("tourGuide.tourComplete")}</p>
						<div className='flex justify-center mt-2'>
							<Button
								id="close-tour"
								variant="primary"
								onClick={() => setIsTourOpen(false)}
							>
								{t("tourGuide.closeTourButton")}
							</Button>
						</div>
					</>
				)
			}

		];

		const updatedSteps = commonSteps.map((step, index) => {
			return {
				...step,
				action: () => {
					if (screenType !== 'desktop') {
						if (index === 5 && !isOpen) {
							toggleMenu();
						} else if (index !== 5 && isOpen) {
							toggleMenu();
						}
					}
				}
			};
		});

		setSteps(updatedSteps);
	}, [t, toggleMenu, isOpen, screenType]);

	const startTour = () => {
		setIsModalOpen(false);
		api.updateShowWelcome(false);
		setIsTourOpen(true);
	};

	const closeModalAndDisable = () => {
		setIsModalOpen(false);
		api.updateShowWelcome(false);
	};

	const renderModal = () => {

		if (authenticationType === 'signup' && showWelcome) {
			return (
				<div>
					<WelcomeModal isOpen={isModalOpen} onStartTour={startTour} onClose={closeModalAndDisable} />
				</div>
			);
		} else {
			return null;
		}
	};

	return (
		<div>
			{renderModal()}
			<Tour
				steps={steps}
				isOpen={isTourOpen}
				rounded={5}
				onRequestClose={() => setIsTourOpen(false)}
				disableInteraction={true}
				className="reactour_close"
			/>
		</div>
	);
};

export default TourGuide;
