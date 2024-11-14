// StatusRibbon.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckExpired } from '../../functions/CheckExpired';

const StatusRibbon = ({ parsedCredential }) => {
	const { t } = useTranslation();

	return (
		<>
			{parsedCredential && CheckExpired(parsedCredential.expiry_date) &&
				<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg border-t-2 border-l-2 border-gray-200 dark:border-gray-800 ${CheckExpired(parsedCredential.expiry_date) && 'bg-red-600'}`}>
					{t('statusRibbon.expired')}
				</div>
			}
		</>
	);
};

export default StatusRibbon;
