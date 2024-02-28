import React from 'react';
import Spinner from '../../components/Spinner';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

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
						<h2 className="text-lg font-bold mb-2 text-custom-blue">
							<FaShare size={20} className="inline mr-1 mb-1" />
							{popupTitle}
						</h2>
						<hr className="mb-2 border-t border-custom-blue/80" />
						<p className="mb-2 mt-4">
							{popupMessage}
						</p>
						<div className="flex justify-end space-x-2 pt-4">
							<button className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center" onClick={handleClose}>
								{t('common.cancel')}
							</button>
							<button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={handleContinue}>
								{t('common.continue')}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default RedirectPopup;
