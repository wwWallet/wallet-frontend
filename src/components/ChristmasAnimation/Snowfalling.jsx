import React, { useEffect, useState } from 'react';
import Snowfall from 'react-snowfall';

const Snowfalling = () => {
	const [isChristmasSeason, setIsChristmasSeason] = useState(false);

	useEffect(() => {
		const checkSeason = () => {
			const today = new Date(); // Use new Date() for real-time or new Date(new Date().getFullYear(), 0, 1) for testing January 1st
			const currentYear = today.getFullYear();

			// Christmas season part 1: December 1st to December 20th of the current year
			const christmasStart = new Date(currentYear, 11, 20); // December 20
			const christmasEnd = new Date(currentYear, 11, 31); // December 31

			// Christmas season part 2: January 1st to January 6th of the next year
			const newYearStart = new Date(currentYear, 0, 1); // January 1
			const newYearEnd = new Date(currentYear, 0, 6); // January 6

			// Check if today is within either part of the Christmas season
			return (today >= christmasStart && today <= christmasEnd) ||
				(today >= newYearStart && today <= newYearEnd);
		};

		setIsChristmasSeason(checkSeason());
	}, []);

	return (
		<>
			{isChristmasSeason && <Snowfall snowflakeCount={50} />}
		</>
	);
}

export default Snowfalling;
