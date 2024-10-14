import React from 'react';
import useScreenType from '../hooks/useScreenType';

const PageDescription = ({ description }) => {
	const screenType = useScreenType();

	return (
		<>
			{screenType !== 'mobile' && (
				<p className="italic pd-2 text-gray-700 dark:text-gray-300">{description}</p>
			)}
		</>
	);
}

export default PageDescription;
