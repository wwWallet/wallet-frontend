// ExpiredRibbon.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckExpired } from '../../functions/CheckExpired';

const ExpiredRibbon = ({ parsedCredential }) => {
	const { t } = useTranslation();

	return (
		<>
			{parsedCredential && CheckExpired(parsedCredential.expiry_date) &&
				<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg rounded-br-2xl border-t border-l border-white ${CheckExpired(parsedCredential.expirationDate) ? 'bg-red-600' : 'bg-green-500'}`}>
					{t('expiredRibbon.expired')}
				</div>
			}
		</>
	);
};

export default ExpiredRibbon;
