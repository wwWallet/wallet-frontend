import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import Spinner from '../Shared/Spinner';
import PopupLayout from './PopupLayout';

const RedirectPopup = ({ loading, availableCredentialConfigurations, onClose, handleContinue, popupTitle, popupMessage }) => {
	const { t } = useTranslation();

	const locale = 'en-US';

	const [selectedConfiguration, setSelectedConfiguration] = useState(null);

	const configurationsCount = availableCredentialConfigurations ? Object.keys(availableCredentialConfigurations).length : 0;

	useEffect(() => {
		if (availableCredentialConfigurations) {
			setSelectedConfiguration(Object.keys(availableCredentialConfigurations)[0])
		}
	}, [])

	const handleOptionChange = (event) => {
		if (availableCredentialConfigurations) {
			setSelectedConfiguration(availableCredentialConfigurations[event.target.value]);
		}
	};

	return (
		<PopupLayout isOpen={true} onClose={onClose} loading={loading}>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				<FaShare size={20} className="inline mr-1 mb-1" />
				{popupTitle}
			</h2>
			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
			<p className="mb-2 mt-4 text-gray-700 dark:text-white">
				{popupMessage}
			</p>

			{configurationsCount > 1 && Object.keys(availableCredentialConfigurations).map((credentialConfigurationId, index) => {
				return (
					<div class="flex items-center mb-4">
						<input
							id={"radio-" + index}
							onChange={handleOptionChange}
							type="radio"
							value={credentialConfigurationId}
							name="default-radio"
							class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
							checked={selectedConfiguration === availableCredentialConfigurations[credentialConfigurationId]}
							aria-label={`Option ${credentialConfigurationId}`}
						/>
						<label for={"radio-" + index} class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
							{(availableCredentialConfigurations[credentialConfigurationId]?.display ? availableCredentialConfigurations[credentialConfigurationId]?.display.filter((d) => d.locale === locale)[0].name : null) ?? credentialConfigurationId}
						</label>
					</div>
				)
			})}

			<div className="flex justify-end space-x-2 pt-4">
				<Button variant="cancel" onClick={onClose}>
					{t('common.cancel')}
				</Button>
				<Button variant="primary" onClick={() => handleContinue(selectedConfiguration)}>
					{t('common.continue')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default RedirectPopup;
