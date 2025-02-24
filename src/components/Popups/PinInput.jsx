// PinInput.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import SessionContext from '@/context/SessionContext';
import PopupLayout from './PopupLayout';

function PinInput({ isOpen, setIsOpen }) {
	const { api } = useContext(SessionContext);
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
	const firstInputRef = inputRefs[0];

	useEffect(() => {
		if (firstInputRef.current) {
			firstInputRef.current.focus();
		}
	}, [firstInputRef]);

	const handleCancel = () => {
		setIsOpen(false);
		navigate('/');
	};

	const handleSubmit = async () => {
		try {
			const userPin = pin.join('');
			await api.post('/communication/handle', { user_pin: userPin });
			setIsOpen(false);
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

	if (!isOpen) {
		return null;
	}

	const handleInputKeyPress = (event) => {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	};

	return (
		<PopupLayout isOpen={isOpen} onClose={false}>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				<FaLock size={20} className="inline mr-1 mb-1" />
				{t('PinInputPopup.title')}
			</h2>
			<hr className="mb-2 border-t border-primary/80 border-white/80" />
			<p className="italic pd-2 text-gray-700 dark:text-white">
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
						className="w-10 px-3 mx-1 my-2 py-2 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride"
						ref={inputRefs[index]}
					/>
				))}
			</div>

			<div className="flex justify-end space-x-2 pt-4">
				<Button variant="cancel" onClick={handleCancel}>
					{t('common.cancel')}
				</Button>
				<Button variant="primary" onClick={handleSubmit}>
					{t('common.submit')}
				</Button>
			</div>
		</PopupLayout>
	);
}

export default PinInput;
