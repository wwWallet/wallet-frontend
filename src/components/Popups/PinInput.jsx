// PinInput.js
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { faLock } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import SessionContext from '@/context/SessionContext';

import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

function PinInput({ isOpen, setIsOpen }) {
	//General
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { api } = useContext(SessionContext);

	//State
	const [isClosing, setIsClosing] = useState(false);

	const [pin, setPin] = useState(['', '', '', '']);
	const [errMessage, setErrMessage] = useState('');

	//Refs
	const inputRefs = [
		useRef(null),
		useRef(null),
		useRef(null),
		useRef(null)
	];
	const firstInputRef = inputRefs[0];

	//Effects
	useEffect(() => {
		if (firstInputRef.current) {
			firstInputRef.current.focus();
		}
	}, [firstInputRef]);

	//Handlers
	const handleCancel = () => {
		navigate('/');

		setIsClosing(true);
		setTimeout(() => {
			setIsOpen(false);
			setIsClosing(false);
		}, 200);
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

	const handleInputKeyPress = (event) => {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	};

	//Render
	if (!isOpen) {
		return null;
	}

	return (
		<PopupLayout isOpen={isOpen} isClosing={isClosing} onClose={false}>
			<div className="flex items-start justify-between">
				<div className={`flex items-center justify-center w-12 h-12 rounded-full bg-c-lm-gray-300 dark:bg-c-dm-gray-800`}>
					<FontAwesomeIcon icon={faLock} className={`text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100`} />
				</div>

				<div className='flex-1 ml-4 mr-12'>
					<h2 className="text-xl font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{t('PinInputPopup.title')}
					</h2>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('PinInputPopup.description')}
					</p>

					{errMessage && 
						<p className='text-sm text-red-600'>{errMessage}</p>
					}

					<div className='mt-5 flex flex-wrap -ml-1 flex items-center'>
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
								className={`
									text-center font-semibold text-lg w-10 px-3 mx-1 py-2
									bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 
									dark:inputDarkModeOverride text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg
									outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
								`}
								ref={inputRefs[index]}
							/>
						))}
					</div>

					<div className="flex items-center space-x-2 mt-7">
						<Button
							id="submit-pin-input"
							variant="tertiary"
							onClick={handleSubmit}
							size='md'
							textSize='md'
						>
							{t('common.submit')}
						</Button>

						<Button
							id="close-delete-popup"
							variant="cancel"
							onClick={handleCancel}
							size='md'
							textSize='md'
						>
							{t('common.cancel')}
						</Button>
					</div>
				</div>
			</div>
		</PopupLayout>
	);
}

export default PinInput;
