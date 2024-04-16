import React from 'react';
import Spinner from '../../components/Spinner';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import GetButton from '../Buttons/GetButton';

const RedirectPopup = ({ loading, handleClose, handleContinue, popupTitle, popupMessage }) => {
	const { t } = useTranslation();

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50"></div>
			<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
				{loading ? (
					<div className="flex items-center justify-center h-24">
						<Spinner />
					</div>
				) : (
					<>
						<h2 className="text-lg font-bold mb-2 text-primary">
							<FaShare size={20} className="inline mr-1 mb-1" />
							{popupTitle}
						</h2>
						<hr className="mb-2 border-t border-primary/80" />
						<p className="mb-2 mt-4">
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
					</>
				)}
			</div>
		</div>
	);
};

export default RedirectPopup;
