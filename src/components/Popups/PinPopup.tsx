import React, { useState, useEffect, useMemo } from 'react';
import { FaLock } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

interface PinInputProps {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	inputsCount: number;
	onCancel?: () => void;
	onSubmit?: (pin: string) => void;
}

const PinInput = ({
	isOpen,
	setIsOpen,
	inputsCount,
	onCancel,
	onSubmit,
}: PinInputProps) => {
	const [errMessage, setErrMessage] = useState<string>('');
	const [pin, setPin] = useState<string[]>(Array(inputsCount).fill(''));
	const { t } = useTranslation();

	const inputRefs = useMemo(() => Array.from({ length: inputsCount }, () => React.createRef<HTMLInputElement>()), [inputsCount]);

	useEffect(() => {
		if (inputRefs[0]?.current) {
			inputRefs[0].current.focus();
		}
	}, [inputRefs]);

	const handleCancel = () => {
		setIsOpen(false);
		onCancel?.();
	};

	const handleSubmit = async () => {
		const userPin = pin.join('');
		try {
			setIsOpen(false);
			onSubmit?.(userPin);
		} catch (err) {
			setErrMessage(`${t('PinInputPopup.errMessage')}`);
		}
	};

	const handleInputChange = (index: number, value: string) => {
		setErrMessage('');
		if (/^\d*$/.test(value) && value.length <= 1) {
			const newPin = [...pin];
			newPin[index] = value;

			setPin(newPin);

			if (value !== '' && index < inputsCount - 1) {
				const nextInput = inputRefs[index + 1].current;
				nextInput?.focus();
			}
		}
	};

	const handleInputKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
		setErrMessage('');
		if (event.key === 'Backspace' && pin[index] === '' && index > 0) {
			inputRefs[index - 1].current?.focus();
			const newPin = [...pin];
			newPin[index - 1] = '';
			setPin(newPin);
		}
	};

	const handleInputPaste = (pastedValue: string) => {
		setErrMessage('');
		if (/^\d+$/.test(pastedValue)) {
			const newPin = pastedValue.split('').slice(0, inputsCount);
			while (newPin.length < inputsCount) {
				newPin.push('');
			}
			setPin(newPin);
			inputRefs[newPin.length - 1]?.current?.focus();
		}
	};

	if (!isOpen) {
		return null;
	}

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
			<div className='mt-2 flex flex-wrap justify-center overflow-y-auto max-h-[50vh]'>
				{pin.map((digit, index) => (
					<input
						type="text"
						key={index}
						value={digit}
						onChange={(e) => handleInputChange(index, e.target.value)}
						onKeyDown={(e) => handleInputKeyDown(index, e)}
						onPaste={(e) => handleInputPaste(e.clipboardData.getData('Text'))}
						className="w-10 px-3 mx-1 my-2 py-2 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						ref={inputRefs[index]}
						autoFocus={index === 0}
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
};

export default PinInput;
