// AddCredentialCard.js
import { PlusCircle, QrCode } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

const AddCredentialCard = ({ onClick }) => {
	const { t } = useTranslation();

	return (
		<button
			id="add-credential-card"
			onClick={onClick}
			className="step-1 relative w-full aspect-[1.6] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all bg-gradient-to-br from-c-lm-gray-600 via-c-lm-gray-700 to-c-lm-gray-800 text-c-lm-gray-100 dark:from-c-dm-gray-600 dark:via-c-dm-gray-700 dark:to-c-dm-gray-800"
		>
			{/* Decorative background layers */}
			<div className="absolute inset-0 bg-white/10 backdrop-blur-xs z-0" />
			<div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.06)_1px,_transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0" />

			<div className="relative z-10 flex flex-col justify-between h-full w-full p-4">
				<div className="flex items-start justify-between text-md md:text-xs lg:text-sm font-semibold">
					<span className="text-left">{t('pageCredentials.addCard.title')}</span>
					<QrCode size={20} className="text-white/80" />
				</div>

				<div className="flex flex-col items-center justify-center text-center grow">
					<PlusCircle className="text-c-lm-gray-100 text-4xl md:text-2xl lg:text-4xl" />
					<span className="mt-2 text-base md:text-xs lg:text-sm font-semibold">
						{t('pageCredentials.addCard.text')}
					</span>
				</div>
			</div>
		</button>
	);
};

export default AddCredentialCard;
