import { useState, useEffect } from 'react';

const getScreenType = (width) => {
	if (width < 480) return 'mobile';
	if (width >= 480 && width < 768) return 'tablet';
	return 'desktop';
};

const useScreenType = () => {
	const [screenType, setScreenType] = useState(getScreenType(window.innerWidth));

	useEffect(() => {
		const handleResize = () => {
			setScreenType(getScreenType(window.innerWidth));
		};

		window.addEventListener('resize', handleResize);

		// Clean up the event listener on component unmount
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return screenType;
};

export default useScreenType;
