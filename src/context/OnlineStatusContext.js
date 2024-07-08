import axios from 'axios';
import React, { useEffect, Suspense, createContext, useState } from 'react';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
	const [isOnline, setIsOnline] = useState(null);

	const update = async () => {
		while(1) {
			const newStatusUpdate = await new Promise((resolve, reject) => {
				setTimeout(() => {
					// will later use web sockets
					axios.get(`${process.env.REACT_APP_WALLET_BACKEND_URL}/status`, { timeout: 2000 })
						.then((res) => {
							resolve(true);
						})
						.catch(err => {
							resolve(false);
						});
				}, 3000);
			});
			if (isOnline == null || isOnline != newStatusUpdate) {
				setIsOnline(newStatusUpdate);
			}
		}
	}

	useEffect(() => {
		update();
	}, [])

	return (
		<OnlineStatusContext.Provider value={{ isOnline }}>
			{children}
		</OnlineStatusContext.Provider>
	)
}

export default OnlineStatusContext;