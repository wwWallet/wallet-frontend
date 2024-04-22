import React from 'react';
import Modal from 'react-modal';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import GetButton from '../Buttons/GetButton';
import Spinner from '../../components/Spinner';


const RedirectPopup = ({ loading, handleClose, handleContinue, popupTitle, popupMessage }) => {
	const { t } = useTranslation();

	if (loading) {
		return (
			<Modal
				isOpen={true}
				onRequestClose={handleClose}
				className="absolute inset-0 flex items-center justify-center"
				overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			>
				<Spinner />
			</Modal>
		);
	}
	return (
		<Modal
			isOpen={true}
			onRequestClose={handleClose}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				<FaShare size={20} className="inline mr-1 mb-1" />
				{popupTitle}
			</h2>
			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
			<p className="mb-2 mt-4 text-gray-700 dark:text-white">
				{popupMessage}
			</p>
			<div className="flex justify-end space-x-2 pt-4">
				<GetButton
					content={t('common.cancel')}
					onClick={handleClose}
					variant="cancel"
				/>
				<GetButton
					content={t('common.continue')}
					onClick={handleContinue}
					variant="primary"
				/>
			</div>
		</Modal>
	);
};

export default RedirectPopup;

