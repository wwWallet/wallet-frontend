import React, { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';

const Snowfalling = () => {
	const [isChristmasSeason, setIsChristmasSeason] = useState(false);

	useEffect(() => {
		const checkSeason = () => {
			const today = new Date();
			const currentYear = today.getFullYear();

			const start = new Date(currentYear, 11, 20);
			const end = new Date(currentYear + 1, 0, 6);

			return today >= start && today <= end;
		};

		setIsChristmasSeason(checkSeason());
	}, []);

	return (
		<>
			{isChristmasSeason && <Snowfall snowflakeCount={200} />}
		</>
	);
}

export default Snowfalling;
