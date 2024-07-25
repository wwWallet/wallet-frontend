import React, { useEffect, Suspense, createContext, useState } from 'react';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
	const [isOnline, setIsOnline] = useState(null);

	const update = async () => {
		setIsOnline(() => navigator.onLine && navigator.connection?.type !== "unknown")
		while (1) { // loop for checks
			await new Promise((resolve, reject) => { // wait 3 seconds
				setTimeout(() => {
					resolve();
				}, 3000);
			});
			if (isOnline === null || isOnline !== (navigator.onLine && navigator.connection?.type !== "unknown")) {
				setIsOnline(() => (navigator.onLine && navigator.connection?.type !== "unknown"));
			}
		}
	}

	useEffect(() => {
		update();
	}, [])

	useEffect(() => {
		console.log("Online status changed to ", isOnline)
	}, [isOnline])

	return (
		<OnlineStatusContext.Provider value={{ isOnline }}>
			{children}
		</OnlineStatusContext.Provider>
	)
}

export default OnlineStatusContext;
