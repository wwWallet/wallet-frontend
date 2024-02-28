// PinInput.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useApi } from '../../api';

function PinInput({ showPopup, setShowPopup }) {
	const api = useApi();
	const navigate = useNavigate();
	const [errMessage, setErrMessage] = useState('');
	const [pin, setPin] = useState(['', '', '', '']);
	const { t } = useTranslation();

	const inputRefs = [
		useRef(null),
		useRef(null),
		useRef(null),
		useRef(null)
	];

	const handleCancel = () => {
		setShowPopup(false);
		navigate('/');
	}

	const handleSubmit = async () => {
		try {
			const userPin = pin.join('');
			await api.post('/communication/handle', { user_pin: userPin });
			setShowPopup(false);
		} catch (err) {
			setErrMessage(`${t('PinInputPopup.errMessage')}`);
		}
	};

	const handleInputChange = (index, value) => {
		setErrMessage('');
		if (/^\d*$/.test(value) && value.length <= 1) {
			const newPin = [...pin];
			newPin[index] = value;

			setPin(newPin);

			if (value === '' && index > 0) {
				// Move focus to the previous input field and clear it if the value is cleared
				inputRefs[index - 1].current.focus();
				newPin[index - 1] = '';
			} else if (value !== '' && index < 3) {
				// Move focus to the next input and clean it
				const nextInput = inputRefs[index + 1].current;
				newPin[index + 1] = '';
				setPin(newPin);
				nextInput.focus();
				nextInput.select();
			} else if (value !== '' && index === 3) {
				// Clear next input fields if you are in the last input
				for (let i = index + 1; i < newPin.length; i++) {
					newPin[i] = '';
				}
				setPin(newPin);
			}
		}
	};

	const handleInputKeyDown = (index, event) => {
		setErrMessage('');
		if (event.key === 'Backspace' && pin[index] === '' && index > 0) {
			inputRefs[index - 1].current.focus();
			const newPin = [...pin];
			newPin[index - 1] = '';
			setPin(newPin);
		}
	};

	const handleInputClick = (index) => {
		setErrMessage('');
		const newPin = [...pin];
		newPin[index] = '';
		setPin(newPin);

	};

	const handleInputPaste = (pastedValue) => {
		setErrMessage('');
		if (/^\d{1,4}$/.test(pastedValue)) {
			const newPin = Array.from(pastedValue, (char) => char);

			const updatedPin = [...newPin];
			while (updatedPin.length < pin.length) {
				updatedPin.push('');
			}
			setPin(updatedPin);

			inputRefs[inputRefs.length - 1].current.focus();
		}
	};

	useEffect(() => {
		inputRefs[0].current.focus();
	}, []);

	if (!showPopup) {
		return null;
	}

	const handleInputKeyPress = (event) => {
		if (event.key === 'Enter') {
			handleSubmit();
		}
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
					{pin.map((digit, index) => (
						<input
							type="text"
							key={index}
							value={digit}
							onChange={(e) => handleInputChange(index, e.target.value)}
							onKeyDown={(e) => handleInputKeyDown(index, e)}
							onClick={() => handleInputClick(index)}
							onPaste={(e) => handleInputPaste(e.clipboardData.getData('Text'))}
							onKeyPress={(e) => handleInputKeyPress(e)}
							className="w-10 px-3 mx-1 my-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							ref={inputRefs[index]}
						/>
					))}
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

export default PinInput;
