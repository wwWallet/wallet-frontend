import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useApi } from '../api';

function Popup({ showPinPopup, setShowPinPopup }) {
	const api = useApi();
	const navigate = useNavigate();
	const [errMessage, setErrMessage] = useState('');
	const [pin, setPin] = useState('');
	const { t } = useTranslation();

	const handleCancel = () => {
		setShowPinPopup(false);
		navigate('/');
	}

	const handleSubmit = async () => {

		try {
			const res = await api.post('/communication/handle', { user_pin: pin });
			console.log(res);
			setShowPinPopup(false);
		}
		catch (err) {
			setErrMessage(`${t('PinInputPopup.errMessage')}`);
		};
	}

	if (!showPinPopup) {
		return null;
	};

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50"></div>
			<div className="bg-white p-4 rounded-lg shadow-lg w-full max-h-[80vh] lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4 ">
				<h2 className="text-lg font-bold mb-2 text-custom-blue">
					<FaLock size={20} className="inline mr-1 mb-1" />
					{t('PinInputPopup.title')}
				</h2>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic pd-2 text-gray-700">
					{t('PinInputPopup.description')}
				</p>
				{errMessage && (
					<p className='text-sm text-red-600'>{errMessage}</p>
				)}
				<div className='mt-2 flex flex-wrap justify-center flex overflow-y-auto max-h-[50vh]'>
					<input
						type="password"
						placeholder={t('PinInputPopup.inputPlaceholder')}
						value={pin}
						onChange={(e) => { setPin(e.target.value); setErrMessage("") }}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<div className="flex justify-end space-x-2 pt-4">
					<button
						className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
						onClick={handleCancel}
					>
						{t('common.cancel')}
					</button>
					<button
						className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
						onClick={handleSubmit}
					>
						{t('common.submit')}
					</button>
				</div>
			</div>
		</div>
	);
}

export default Popup;
