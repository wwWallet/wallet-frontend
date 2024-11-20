// UsagesRibbon.js
import React from 'react';
import { PiCardsBold } from "react-icons/pi";

const UsagesRibbon = ({ vcEntityInstances }) => {
	const zeroSigCount = vcEntityInstances?.filter(instance => instance.sigCount === 0).length || 0;

	return (
		<>
			{vcEntityInstances &&
				<div className={`z-50 absolute top-[-5px] font-semibold right-[-5px] text-white text-xs py-1 px-3 flex gap-1 items-center rounded-lg border-2 border-gray-100 dark:border-gray-800 ${zeroSigCount === 0 ? 'bg-orange-500' : 'bg-green-500'}`}>
					<PiCardsBold size={18} /> {zeroSigCount}
				</div>
			}
		</>
	);
};

export default UsagesRibbon;
