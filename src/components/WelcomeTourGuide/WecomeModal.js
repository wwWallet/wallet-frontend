import React from 'react';
import Modal from 'react-modal';
import { FaHandshake } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import GetButton from '../Buttons/GetButton';

const WecomeModal = ({ isOpen, onStartTour, onClose }) => {
	const { t } = useTranslation();

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div className="sm:px-6">
				<h2 className="text-3xl text-center font-bold mb-2 text-primary dark:text-white">
					<FaHandshake size={40} className="inline mr-2 mb-1" />
					{t("welcomeModal.title")}
				</h2>
				<hr className=" border-t border-primary/80 dark:border-white/80" />
			</div>
			<div className="px-4 py-2 sm:px-6">
				<p className="pt-2 text-md text-center text-gray-700 dark:text-white">
					{t("welcomeModal.descriptionPart1")} <strong>{t("common.walletName")}</strong> {t("welcomeModal.descriptionPart2")}
				</p>
			</div>
			<p className="text-center text-gray-700 dark:text-white mb-4">
				{t("welcomeModal.question")}
			</p>

			<div className="flex justify-center gap-2 pt-4">
				<GetButton
					content={t("welcomeModal.dismissButton")}
					onClick={onClose}
					variant="cancel"
				/>
				<GetButton
					content={t("welcomeModal.startTourButton")}
					onClick={onStartTour}
					variant="primary"
				/>
			</div>
		</Modal>
	);
};

export default WecomeModal;
