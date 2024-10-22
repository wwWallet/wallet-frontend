// AddCredentialButton.js
import React from 'react';
import { BsPlusCircle } from 'react-icons/bs';
import addImage from '../../assets/images/cred.png';
import { useTranslation } from 'react-i18next';

const AddCredentialCard = ({ onClick }) => {
	const { t } = useTranslation();
	return (
		<button
			className="step-1 relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
			onClick={onClick}
		>
			<img
				src={addImage}
				className="w-full h-auto rounded-xl opacity-100 hover:opacity-120"
				alt=""
			/>
			<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
				<BsPlusCircle size={60} className="text-white mb-2 mt-4" />
				<span className="text-white font-semibold">{t('pageCredentials.addCardTitle')}</span>
			</div>
		</button>
	);
};

export default AddCredentialCard;
