import React from 'react';
import Modal from 'react-modal';
import { useTranslation, Trans } from 'react-i18next';
import Button from '../Buttons/Button';
import { Handshake } from 'lucide-react';

const WecomeModal = ({ isOpen, onStartTour, onClose }) => {
	const { t } = useTranslation();

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="bg-lm-gray-100 dark:bg-dm-gray-900 border border-lm-gray-400 dark:border-dm-gray-600 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-lm-gray-900/50 dark:bg-dm-gray-500/50 flex items-center justify-center backdrop-blur-xs z-50"
		>
			<div className="sm:px-6">
				<h2 className="text-3xl text-center font-bold mb-2 text-lm-gray-900 dark:text-dm-gray-50">
					<Handshake size={40} className="inline mr-2 mb-1" />
					{t('welcomeModal.title')}
				</h2>
			</div>
			<div className="px-4 py-2 sm:px-6">
				<p className="pt-2 text-md text-center text-lm-gray-800 dark:text-dm-gray-50">
					<Trans
						i18nKey="welcomeModal.description"
						components={{ strong: <strong /> }}
					/>
				</p>
			</div>
			<p className="text-center text-lm-gray-800 dark:text-dm-gray-50 mb-4">
				{t('welcomeModal.question')}
			</p>

			<div className="flex justify-center gap-2 pt-4">
				<Button
					id="close-welcome-modal"
					onClick={onClose}
				>
					{t("welcomeModal.dismissButton")}
				</Button>
				<Button
					id="start-tour-welcome-modal"
					variant="primary"
					onClick={onStartTour}
				>
					{t("welcomeModal.startTourButton")}
				</Button>
			</div>
		</Modal>
	);
};

export default WecomeModal;
