import React from 'react';
import { FaHandshake } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

const WecomeModal = ({ isOpen, onStartTour, onClose }) => {
	const modalStyle = isOpen ? 'block' : 'hidden';
	const { t } = useTranslation();

	return (
		<div className={`fixed inset-0 ${modalStyle} overflow-y-auto z-50`}>
			<div
				className={`flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 ${isOpen ? 'opacity-100' : 'opacity-0' // Fade-in animation
					}`}
			>
				<div className="fixed inset-0 transition-opacity" aria-hidden="true">
					<div className="absolute inset-0 bg-gray-500 opacity-75"></div>
				</div>

				<span
					className="hidden sm:inline-block sm:align-middle sm:h-screen"
					aria-hidden="true"
				></span>

				<div
					className="p-4 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
					role="dialog"
					aria-modal="true"
					aria-labelledby="modal-headline"
				>
					<div className="bg-white sm:px-6">
						<h2 className="text-3xl text-center font-bold mb-2 text-custom-blue">
							<FaHandshake size={40} className="inline mr-2 mb-1" />
							{t("welcomeModal.title")}
						</h2>
						<hr className=" border-t border-custom-blue/80" />
					</div>
					<div className="bg-white bg-white px-4 py-2 sm:px-6">
						<p className="pt-2 text-md text-center text-gray-900">
						{t("welcomeModal.descriptionPart1")} <strong>{t("common.walletName")}</strong> {t("welcomeModal.descriptionPart2")}
						</p>
					</div>
					<p className="text-center text-gray-900 mb-4">
					{t("welcomeModal.question")}
					</p>
					<div className="flex justify-end space-x-2 pt-4">
						<button className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center" onClick={onClose}>
							{t("welcomeModal.dismissButton")}
						</button>
						<button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={onStartTour}>
							{t("welcomeModal.startTourButton")}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default WecomeModal;