import React, { useState,useEffect } from 'react';
import Tour from 'reactour';

import Modal from './Modal';
import { useApi } from '../../api';

const TourGuide = ({ toggleMenu, isOpen }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [steps, setSteps] = useState([]);
	const api = useApi();
	const { authenticationType } = api.getSession();
	console.log(authenticationType);

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
				content: 'In this page you will Manage you passkeys and your account.',
			},
			{
				selector: '.step-5',
				content: 'In "Credentials" page is the current Home page',
			},
			{
				selector: '.step-6',
				content: 'In "History" page you can view credential transmissions, detailing when and to which verifiers you sent it.',
			},
			{
				selector: '.step-7',
				content: 'In "Add Credentials" you can choose an issuer for credential retrieval, the same with the Add and card buttons.',
			},
			{
				selector: '.step-8',
				content: 'In "Send Credentials" you can choose a verifier to share credentials with.',
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
              // For steps 4 to 7, open the menu if it's not already open
              toggleMenu();
            } else if ((index < 3 || index > 7) && isOpen) {
              // For all other steps, ensure the menu is closed
              toggleMenu();
            }
          }
        }
      };
    });

		setSteps(updatedSteps);
  }, [toggleMenu, isOpen]); // Add both toggleMenu and isOpen to the dependency array

	const startTour = () => {
    setIsModalOpen(false);
		sessionStorage.setItem('welcomeModal', 'false');
    setIsTourOpen(true);
  };
	
	const closeModalAndDisable = () => {
    setIsModalOpen(false);
    // Store a flag in session storage to remember that the modal has been closed
    sessionStorage.setItem('welcomeModal', 'true');
  };

  const renderModal = () => {
		const welcomeModal = sessionStorage.getItem('welcomeModal');
    if (authenticationType === 'signup' && !welcomeModal) {
      return (
				<div >
					<Modal isOpen={isModalOpen} onStartTour={startTour} onClose={closeModalAndDisable}>
					</Modal>
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