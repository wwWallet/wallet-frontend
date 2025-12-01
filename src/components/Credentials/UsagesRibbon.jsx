// UsagesRibbon.js
import { GalleryHorizontalEnd } from 'lucide-react';
import React from 'react';

const UsagesRibbon = ({ vcEntityInstances, borderColor }) => {
	const zeroSigCount = vcEntityInstances?.filter(instance => instance.sigCount === 0).length || 0;

	return (
		<>
			{vcEntityInstances &&
				<div className={`z-40 absolute top-[-5px] font-semibold right-[-5px] text-xs py-1 px-3 flex gap-1 items-center rounded-lg border-2 ${borderColor ?? 'border-lm-gray-100 dark:border-dm-gray-900'} ${zeroSigCount === 0 ? 'text-lm-gray-900 bg-lm-orange dark:bg-dm-orange' : 'text-white dark:text-lm-gray-900 bg-lm-green dark:bg-dm-green'}`}>
					<GalleryHorizontalEnd size={16} /> {zeroSigCount}
				</div>
			}
		</>
	);
};

export default UsagesRibbon;
