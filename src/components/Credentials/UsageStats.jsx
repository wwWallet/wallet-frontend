import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/pro-regular-svg-icons';

import useScreenType from '@/hooks/useScreenType';

export default function UsageStats({ vcEntity }) {
	//General
	const { t } = useTranslation();
	const screenType = useScreenType();

	//State
	const sigTotal = useMemo(() => 
		vcEntity ? vcEntity.instances.length : 0
	, [vcEntity])

	const zeroSigCount = useMemo(() => 
		vcEntity ? vcEntity.instances.filter(instance => instance.sigCount === 0).length || 0 : 0
	, [vcEntity])

	//Failsafe
	if (zeroSigCount === null || !sigTotal) {
		return null
	}
	
	//Render
	return (
		<div className={`flex items-center text-c-lm-gray-700 dark:text-c-dm-gray-300 text-sm`}>
			<FontAwesomeIcon icon={faLayerGroup} className='mr-2' />

			<p>
				{zeroSigCount} / {sigTotal} {t('pageCredentials.details.availableUsages')}
			</p>
		</div>
	);
}
