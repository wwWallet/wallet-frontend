import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PiCardsBold } from "react-icons/pi";

import useScreenType from '@/hooks/useScreenType';

const UsageStats = ({ vcEntity, className }) => {
	const { t } = useTranslation();
	const screenType = useScreenType();

	const sigTotal = useMemo(() => 
		vcEntity ? vcEntity.instances.length : 0
	, [vcEntity]);

	const zeroSigCount = useMemo(() => 
		vcEntity ? vcEntity.instances.filter(instance => instance.sigCount === 0).length || 0 : 0
	, [vcEntity]);

	// Don't render if no data
	if (zeroSigCount === null || !sigTotal) {
		return null;
	}

	return (
		<div className={`flex items-center text-gray-700 dark:text-gray-300 ${screenType === 'mobile' ? 'text-sm' : 'text-sm'} ${className}`}>
			<PiCardsBold className="mr-2" />
			<p>
				{zeroSigCount} / {sigTotal} {t('pageCredentials.details.availableUsages')}
			</p>
		</div>
	);
};

export default UsageStats;
