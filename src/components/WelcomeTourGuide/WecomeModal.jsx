import React, { useState } from 'react';
import Modal from 'react-modal';
import { useTranslation, Trans } from 'react-i18next';

import Logo from '../Logo/Logo';
import Button from '../Buttons/Button';

const WecomeModal = ({ isOpen, onStartTour, onClose: onCloseProp }) => {
	//General
	const { t } = useTranslation();

	//State
	const [isClosing, setIsClosing] = useState(false);

	//Handlers
	const onClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onCloseProp();
		}, 200);
	}

	//Render
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className={`
				popup-layout-opening ${isClosing ? 'popup-layout-closing' : ''}
				relative p-8 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3
				bg-c-lm-gray-100 dark:bg-c-dm-gray-900 border border-c-lm-gray-300 dark:border-c-dm-gray-800
			`}
			overlayClassName={`
				fixed inset-0 bg-black flex items-center justify-center
				bg-black bg-opacity-50 backdrop-blur-sm z-50
				popup-overlay-opening ${isClosing ? 'popup-overlay-closing' : ''}
			`}
		>
			<div className="flex flex-col justify-center items-center sm:px-6 mb-2">
				<Logo imgClassName='w-10 h-10 mb-7' />

				<h2 className="text-2xl text-center font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
					{t('welcomeModal.title')}
				</h2>
			</div>

			<p className="text-md text-center text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-6">
				<Trans
					i18nKey="welcomeModal.description"
					components={{ strong: <strong /> }}
				/>
			</p>

			<p className="text-md text-center text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-4">
				{t('welcomeModal.question')}
			</p>

			<div className="flex justify-center gap-2 mt-7 mb-0.5">
				<Button
					id="close-welcome-modal"
					variant="cancel"
					onClick={onClose}
					size='md'
					textSize='md'
				>
					{t("welcomeModal.dismissButton")}
				</Button>
				<Button
					id="start-tour-welcome-modal"
					variant="tertiary"
					onClick={onStartTour}
					size='md'
					textSize='md'
				>
					{t("welcomeModal.startTourButton")}
				</Button>
			</div>
		</Modal>
	);
};

export default WecomeModal;
