// AddCredentialButton.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus } from '@fortawesome/pro-light-svg-icons';

const AddCredentialCard = ({ onClick }) => {
	//General
	const { t } = useTranslation();

	//Render
	return (
		<button
			id="add-credential-card"
			className="bg-c-lm-gray-300 dark:bg-c-dm-gray-800 hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-700 transition-all duration-150 step-1 relative rounded-xl overflow-hidden cursor-pointer aspect-[16/10]"
			onClick={onClick}
		>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
				<FontAwesomeIcon icon={faCirclePlus} className="text-c-lm-gray-900 dark:text-c-dm-gray-100 mb-6 text-5xl" />

				<span className="text-c-lm-gray-900 dark:text-c-dm-gray-100 font-semibold">{t('pageCredentials.addCardTitle')}</span>
			</div>
		</button>
	);
};

export default AddCredentialCard;
