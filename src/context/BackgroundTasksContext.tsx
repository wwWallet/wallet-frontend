import React, { createContext, useState } from 'react';

export const BackgroundTasksContext = createContext({
	addLoader: () => { },
	removeLoader: () => { },
	isLoading: () => { },
	loading: 0
});

export const BackgroundTasksProvider = ({ children }) => {

	const [loading, setLoading] = useState(0);

	const addLoader = () => { setLoading(loading => loading + 1) }

	const removeLoader = () => { setLoading(loading => loading - 1) }

	const isLoading = () => {
		return loading > 0;
	}

	return (
		<BackgroundTasksContext.Provider value={{ addLoader, removeLoader, isLoading, loading }}>
			{children}
		</BackgroundTasksContext.Provider>
	);
};
