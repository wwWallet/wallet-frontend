import React from 'react';
import useScreenType from '../../hooks/useScreenType';

const PageDescription = ({ description }) => {
	const screenType = useScreenType();

	return (
		<>
			{screenType !== 'mobile' && (
				<p className="italic pd-2 text-c-lm-gray-800 dark:text-c-dm-gray-200">{description}</p>
			)}
		</>
	);
}

export default PageDescription;
