// PinInput.js
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';
import { Lock } from 'lucide-react';

function PinInput({ isOpen, setIsOpen, onSubmit, onCancel, length, input_mode = 'numeric', description }) {
	const [errMessage, setErrMessage] = useState('');
	const parsedLength = Number(length);
	const expectedLength = Number.isInteger(parsedLength) && parsedLength > 0 ? parsedLength : null;
	const normalizedInputMode = input_mode === 'text' ? 'text' : 'numeric';
	const [pin, setPin] = useState(['']);
	const [isSubmitting, setSubmitting] = useState(false);
	const { t } = useTranslation();

	const inputRefs = useRef([]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		setErrMessage('');
		setPin(Array(expectedLength ?? 1).fill(''));
		setSubmitting(false);
		inputRefs.current = inputRefs.current.slice(0, expectedLength ?? 1);
		inputRefs.current[0]?.focus();
	}, [isOpen, expectedLength]);

	const handleCancel = () => {
		setIsOpen(false);
		onCancel?.();
	};

	const sanitizeCode = (value) => {
		const sanitizedValue = normalizedInputMode === 'numeric'
			? value.replace(/\D/g, '')
			: value;
		return expectedLength ? Array.from(sanitizedValue).slice(0, expectedLength).join('') : sanitizedValue;
	};

	const handleSubmit = async () => {
		if (isSubmitting) {
			return;
		}

		try {
			const userPin = pin.join('');
			if (!userPin || (expectedLength && pin.some((digit) => digit === ''))) {
				setErrMessage(`${t('PinInputPopup.errMessage')}`);
				return;
			}

			setSubmitting(true);
			await onSubmit?.(userPin);
			setIsOpen(false);
		} catch (err) {
			setErrMessage(`${t('PinInputPopup.errMessage')}`);
		} finally {
			setSubmitting(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	const handleInputKeyDownSubmit = (event) => {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	};

	const handleInputChange = (value) => {
		setErrMessage('');
		setPin([sanitizeCode(value)]);
	};

	const handlePinDigitChange = (index, value) => {
		setErrMessage('');
		const sanitizedValue = sanitizeCode(value);
		const newPin = [...pin];

		if (sanitizedValue.length > 1) {
			const pastedPin = Array.from(sanitizedValue);
			setPin([
				...pastedPin,
				...Array(expectedLength - pastedPin.length).fill('')
			]);
			inputRefs.current[Math.min(pastedPin.length, expectedLength - 1)]?.focus();
			return;
		}

		newPin[index] = sanitizedValue;
		setPin(newPin);

		if (sanitizedValue && index < expectedLength - 1) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handlePinDigitPaste = (index, event) => {
		event.preventDefault();
		setErrMessage('');
		const pastedPin = Array.from(sanitizeCode(event.clipboardData.getData('Text')));
		if (pastedPin.length === 0) {
			return;
		}

		const newPin = [...pin];
		pastedPin.forEach((digit, offset) => {
			if (index + offset < expectedLength) {
				newPin[index + offset] = digit;
			}
		});
		setPin(newPin);
		inputRefs.current[Math.min(index + pastedPin.length, expectedLength - 1)]?.focus();
	};

	return (
		<PopupLayout isOpen={isOpen} onClose={() => { }} shouldCloseOnOverlayClick={false}>
			<h2 className="text-lg font-bold mb-2 text-lm-gray-900 dark:text-dm-gray-100">
				<Lock size={20} className="inline mr-1 mb-1" />
				{t('PinInputPopup.title')}
			</h2>
			<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
			<p className="italic pd-2 text-lm-gray-800 dark:text-dm-gray-200">
				{description || t('PinInputPopup.description')}
			</p>

			{errMessage && (
				<p className='text-sm text-lm-red dark:text-dm-red'>{errMessage}</p>
			)}
			{expectedLength ? (
				<div className='mt-2 flex flex-wrap justify-center overflow-y-auto max-h-[50vh]'>
					{Array.from({ length: expectedLength }).map((_, index) => (
						<input
							type="text"
							key={index}
							value={pin[index] ?? ''}
							onChange={(e) => handlePinDigitChange(index, e.target.value)}
							onPaste={(e) => handlePinDigitPaste(index, e)}
							onKeyDown={handleInputKeyDownSubmit}
							inputMode={normalizedInputMode}
							pattern={normalizedInputMode === 'numeric' ? '[0-9]*' : undefined}
							maxLength={1}
							autoComplete="one-time-code"
							className="w-10 px-3 mx-1 my-2 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 rounded-md focus:outline-none"
							ref={(element) => {
								inputRefs.current[index] = element;
							}}
						/>
					))}
				</div>
			) : (
				<div className='mt-4'>
					<input
						type="text"
						value={pin[0] ?? ''}
						onChange={(e) => handleInputChange(e.target.value)}
						onKeyDown={handleInputKeyDownSubmit}
						inputMode={normalizedInputMode}
						pattern={normalizedInputMode === 'numeric' ? '[0-9]*' : undefined}
						autoComplete="one-time-code"
						className="w-full px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 rounded-md focus:outline-none"
						ref={(element) => {
							inputRefs.current[0] = element;
						}}
					/>
				</div>
			)}

			<div className="flex justify-end space-x-2 pt-4">
				<Button
					id="cancel-pin-input"
					onClick={handleCancel}
				>
					{t('common.cancel')}
				</Button>
				<Button
					id="submit-pin-input"
					variant="primary"
					onClick={handleSubmit}
					disabled={isSubmitting}
				>
					{t('common.submit')}
				</Button>
			</div>
		</PopupLayout>
	);
}

export default PinInput;
