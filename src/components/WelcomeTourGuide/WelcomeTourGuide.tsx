import React, { useState, useEffect } from 'react';
import { TourProvider, useTour } from '@reactour/tour';
import type { StepType } from '@reactour/tour';
import { useTranslation } from 'react-i18next';

import useScreenType from '../../hooks/useScreenType';
import { useSessionContext } from '@/context/SessionContext';

import WelcomeModal from './WecomeModal';
import Button from '../Buttons/Button';

interface TourGuideProps {
	toggleMenu: () => void;
	isOpen: boolean;
}

const TourGuideContent = ({ toggleMenu, isOpen }: TourGuideProps) => {
	const { setIsOpen: setIsTourOpen, setSteps } = useTour();
	const [isModalOpen, setIsModalOpen] = useState(true);
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
		const commonSteps: StepType[] = [
			{
				selector: '.step-1',
				content: <p className="text-lm-gray-900">{t('tourGuide.tourStep1')}</p>,
				stepInteraction: false,
			},
			{
				selector: getStepSelectorSmallScreen('.step-2'),
				content: <p className="text-lm-gray-900">{t('tourGuide.tourStep2')}</p>,
			},
			{
				selector: getStepSelectorSmallScreen('.step-3'),
				content: <p className="text-lm-gray-900">{t('tourGuide.tourStep3')}</p>,
			},
			...(screenType !== 'desktop'
				? [
						{
							selector: '.step-4',
							content: <p className="text-lm-gray-900">{t('tourGuide.tourStep4')}</p>,
						},
					]
				: []),
			{
				selector: getStepSelectorSmallScreen('.step-5'),
				content: <p className="text-lm-gray-900">{t('tourGuide.tourStep5')}</p>,
			},
			{
				selector: '.step-6',
				content: <p className="text-lm-gray-900">{t('tourGuide.tourStep6')}</p>,
				resizeObservables: ['.step-6'],
			},
			{
				selector: '[data-tour-no-target]',
				position: 'center',
				content: () => (
					<>
						<p className="mt-2 text-lm-gray-900">{t('tourGuide.tourComplete')}</p>
						<div className="flex justify-center mt-2">
							<Button id="close-tour" variant="primary" onClick={() => setIsTourOpen(false)}>
								{t('tourGuide.closeTourButton')}
							</Button>
						</div>
					</>
				),
			},
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
				},
			};
		});

		setSteps?.(updatedSteps);
	}, [t, toggleMenu, isOpen, screenType, setSteps, setIsTourOpen]);

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

	return <div>{renderModal()}</div>;
};

const TourGuide = (props: TourGuideProps) => (
	<TourProvider
		steps={[]}
		styles={{
			maskArea: (base) => ({ ...base, rx: 5 }),
			popover: (base, state) => ({
				...base,
				marginLeft: state?.horizontalAlign === 'right' && /top|bottom/.test(state.position) ? 20 : 0,
			}),
		}}
		position="right"
		disableInteraction
	>
		<TourGuideContent {...props} />
	</TourProvider>
);

export default TourGuide;
