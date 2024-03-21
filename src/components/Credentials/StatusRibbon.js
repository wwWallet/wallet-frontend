// StatusRibbon.js
import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusRibbon = ({ expDate }) => {
	const { t } = useTranslation();

	const CheckExpired = (expDate) => {
		const today = new Date();
		const expirationDate = new Date(expDate);
		return expirationDate < today;
	};

	return (
		<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg border-t border-l border-white ${CheckExpired(expDate) ? 'bg-red-500' : 'bg-green-500'}`}>
			{CheckExpired(expDate) ? `${t('statusRibbon.expired')}` : `${t('statusRibbon.active')}`}
		</div>
	);
};

export default StatusRibbon;
