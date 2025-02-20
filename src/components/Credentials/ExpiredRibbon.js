// ExpiredRibbon.js
import React from 'react';
import { useTranslation } from 'react-i18next';

const ExpiredRibbon = ({ vcEntity }) => {
	const { t } = useTranslation();

	return (
		<>
			{vcEntity.isExpired &&
				<div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg rounded-br-2xl border-t border-l border-white ${vcEntity.isExpired ? 'bg-red-600' : 'bg-green-500'}`}>
					{t('expiredRibbon.expired')}
				</div>
			}
		</>
	);
};

export default ExpiredRibbon;
