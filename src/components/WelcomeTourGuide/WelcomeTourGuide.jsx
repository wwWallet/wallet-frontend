import React, { useState, useEffect, useContext } from 'react';
import Tour from 'reactour';
import { useTranslation } from 'react-i18next';

import useScreenType from '@/hooks/useScreenType';

import SessionContext from '@/context/SessionContext';

import Button from '../Buttons/Button';
import WelcomeModal from './WecomeModal';


const TourGuide = ({ toggleMenu, isOpen }) => {
	//General
	const { t } = useTranslation();
	const screenType = useScreenType();
	const { api } = useContext(SessionContext);
	const { authenticationType, showWelcome } = api.getSession();
	
	//State
	const [steps, setSteps] = useState([]);
	const [isClosing, setIsClosing] = useState(false);
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(true);

	//Effects
	useEffect(() => {
		const getStepSelectorSmallScreen = (stepName) => {
			if (screenType !== 'desktop') {
				return stepName + '-small-screen';
			} else {
				return stepName;
			}
		};
		const commonSteps = [
			{
				selector: '.step-1',
				content: t("tourGuide.tourStep1"),
				disableInteraction: true,
			},
			{
				selector: getStepSelectorSmallScreen('.step-2'),
				content: t("tourGuide.tourStep2"),
			},
			{
				selector: getStepSelectorSmallScreen('.step-3'),
				content: t("tourGuide.tourStep3"),
			},
			...(screenType !== 'desktop' ? [{
				selector: '.step-4',
				content: t("tourGuide.tourStep4"),
			}] : []),
			{
				selector: getStepSelectorSmallScreen('.step-5'),
				content: t("tourGuide.tourStep5"),
			},
			{
				selector: '.step-6',
				content: t("tourGuide.tourStep6"),
			},
			{
				selector: '.step-7',
				content: t("tourGuide.tourStep7"),
			},
			{
				content: () => (
					<>
						<p className='mt-2'>{t("tourGuide.tourComplete")}</p>

						<div className='flex mt-4'>
							<Button
								id="close-tour"
								onClick={() => setIsTourOpen(false)}
								variant="tertiary"
								size='md'
								textSize='md'
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
						if (index >= 5 && index <= 6 && !isOpen) {
							toggleMenu();
						} else if ((index < 5 || index > 6) && isOpen) {
							toggleMenu();
						}
					}
				}
			};
		});

		setSteps(updatedSteps);
	}, [t, toggleMenu, isOpen, screenType]);

	//Handlers
	const startTour = () => {
		setIsModalOpen(false);
		api.updateShowWelcome(false);
		setIsTourOpen(true);
	};

	const closeModalAndDisable = () => {
		setIsClosing(true);
		setTimeout(() => {
			setIsModalOpen(false);
			api.updateShowWelcome(false);
			setIsClosing(false);
		}, 200);
	};

	const renderModal = () => {
		if (authenticationType === 'signup' && showWelcome) {
			return (
				<div>
					<WelcomeModal isOpen={isModalOpen} isClosing={isClosing} onStartTour={startTour} onClose={closeModalAndDisable} />
				</div>
			);
		} else {
			return null;
		}
	};

	//Render
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
