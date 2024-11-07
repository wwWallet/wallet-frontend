import React, { useState, useEffect, useContext } from 'react';
import Tour from 'reactour';
import { useTranslation } from 'react-i18next';

import useScreenType from '../../hooks/useScreenType';
import SessionContext from '../../context/SessionContext';

import WelcomeModal from './WecomeModal';
import Button from '../Buttons/Button';


const TourGuide = ({ toggleMenu, isOpen }) => {
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(true);
	const [steps, setSteps] = useState([]);
	const { api } = useContext(SessionContext);
	const { authenticationType, showWelcome } = api.getSession();
	const { t } = useTranslation();
	const screenType = useScreenType();

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
						<div className='flex justify-center mt-2'>
							<Button variant="primary" onClick={() => setIsTourOpen(false)}>
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
