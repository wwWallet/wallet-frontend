// UsagesRibbon.js
import { GalleryHorizontalEnd } from 'lucide-react';
import React from 'react';

const UsagesRibbon = ({ vcEntityInstances, borderColor }) => {
	const zeroSigCount = vcEntityInstances?.filter(instance => instance.sigCount === 0).length || 0;

	return (
		<>
			{vcEntityInstances &&
				<div className={`z-40 absolute top-[-5px] font-semibold right-[-5px] text-xs py-1 px-3 flex gap-1 items-center rounded-lg border ${borderColor ?? 'border-gray-100 dark:border-gray-900'} ${zeroSigCount === 0 ? 'text-c-lm-gray-900 bg-c-lm-orange dark:bg-c-dm-orange' : 'text-white dark:text-c-lm-gray-900 bg-c-lm-green dark:bg-c-dm-green'}`}>
					<GalleryHorizontalEnd size={18} /> {zeroSigCount}
				</div>
			}
		</>
	);
};

export default UsagesRibbon;
