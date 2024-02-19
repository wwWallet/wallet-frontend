import React, { useState, useEffect } from 'react';
import Tour from 'reactour';

import WelcomeModal from './WecomeModal';
import { useApi } from '../../api';

const TourGuide = ({ toggleMenu, isOpen }) => {
	const [isTourOpen, setIsTourOpen] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(true);
	const [steps, setSteps] = useState([]);
	const api = useApi();
	const { authenticationType, showWelcome } = api.getSession();

	useEffect(() => {
		const commonSteps = [
			{
				selector: '.step-1',
				content: 'Here you will view all of your stored credentials and use the Add new credentials card you will navigate to "Add credentials" page for more.',
				disableInteraction: true,
			},
			{
				selector: '.step-2',
				content: 'With this button you can also navigate to "Add Credentials" page.',
			},
			...(window.innerWidth < 700 ? [{
				selector: '.step-3',
				content: 'By click on this plus button you scan a qr code to get or send credentials.',
			}] : []),
			{
				selector: '.step-4',
				content: 'In "Credentials" page is the current Home page.',
			},
			{
				selector: '.step-5',
				content: 'In "History" page you can view credential transmissions, detailing when and to which verifiers you sent it.',
			},
			{
				selector: '.step-6',
				content: 'In "Add Credentials" page you can choose an issuer for credential retrieval, the same with the Add and card buttons.',
			},
			{
				selector: '.step-7',
				content: 'In "Send Credentials" page you can choose a verifier to share credentials.',
			},
			{
				selector: '.step-8',
				content: 'In "Settings" page you can manage your passkeys and your account.',
			},
			{
				content: () => (
					<>
						<p className='mt-2'>Thank you for completing the tour!</p>
						<div className='flex justify-center mt-2'>
							<button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
								onClick={() => setIsTourOpen(false)}>
								Close Tour
							</button>
						</div>
					</>

				)
			}

		];

		const updatedSteps = commonSteps.map((step, index) => {
			return {
				...step,
				action: () => {
					if (window.innerWidth < 700) {
						if (index >= 3 && index <= 7 && !isOpen) {
							toggleMenu();
						} else if ((index < 3 || index > 7) && isOpen) {
							toggleMenu();
						}
					}
				}
			};
		});

		setSteps(updatedSteps);
	}, [toggleMenu, isOpen]);

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
				<div >
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
			/>
		</div>
	);
};

export default TourGuide;