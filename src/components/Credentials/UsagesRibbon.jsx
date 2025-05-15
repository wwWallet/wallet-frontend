// UsagesRibbon.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCards, faLayerGroup } from '@fortawesome/pro-regular-svg-icons';

const UsagesRibbon = ({ vcEntityInstances }) => {

	//Prepare for render
	const zeroSigCount = vcEntityInstances?.filter(instance => instance.sigCount === 0).length || 0;

	//Render
	return (
		<>
			{vcEntityInstances &&
				<div className={`z-40 absolute top-2 right-2 font-semibold text-white text-xs py-1 px-2.5 flex gap-1.5 items-center rounded-lg ${zeroSigCount === 0 ? 'bg-c-lm-orange dark:bg-c-dm-orange' : 'bg-c-lm-green dark:bg-c-dm-green'}`}>
					<FontAwesomeIcon icon={faLayerGroup} size={18} /> {zeroSigCount}
				</div>
			}
		</>
	);
};

export default UsagesRibbon;
