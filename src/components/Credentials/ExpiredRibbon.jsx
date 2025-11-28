// ExpiredRibbon.js
import React from 'react';
import { useTranslation } from 'react-i18next';

const ExpiredRibbon = ({ vcEntity, borderColor }) => {
	const { t } = useTranslation();

	return (
		<>
			{vcEntity && vcEntity.isExpired &&
				<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg rounded-br-2xl border ${borderColor ?? 'border-lm-gray-100 dark:border-dm-gray-900'} ${vcEntity.isExpired ? 'bg-lm-red dark:bg-dm-red' : 'bg-lm-green dark:bg-dm-green'}`}>
					{t('expiredRibbon.expired')}
				</div>
			}
		</>
	);
};

export default ExpiredRibbon;
