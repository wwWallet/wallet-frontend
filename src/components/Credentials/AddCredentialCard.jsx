// AddCredentialButton.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCirclePlus } from '@fortawesome/pro-light-svg-icons';

import addImage from '../../assets/images/cred.png';

const AddCredentialCard = ({ onClick }) => {
	const { t } = useTranslation();
	return (
		<button
			id="add-credential-card"
			className="bg-c-lm-gray-200 dark:bg-c-dm-gray-800 hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700 transition-all duration-150 step-1 relative rounded-xl overflow-hidden shadow-md cursor-pointer aspect-[16/10]"
			onClick={onClick}
		>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
				<FontAwesomeIcon icon={faCirclePlus} className="text-white mb-6 text-5xl" />

				<span className="text-white font-semibold">{t('pageCredentials.addCardTitle')}</span>
			</div>
		</button>
	);
};

export default AddCredentialCard;
