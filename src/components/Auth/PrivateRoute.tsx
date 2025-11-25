import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';

const PrivateRoute = ({ children }: { children?: React.ReactNode }): React.ReactElement => {
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const cachedUsers = keystore.getCachedUsers();

	const queryParams = new URLSearchParams(window.location.search);
	const state = queryParams.get('state');

	const userExistsInCache = (state: string) => {
		if (!state) return false;
		try {
			const decodedState = JSON.parse(atob(state));
			return cachedUsers.some(user => user.userHandleB64u === decodedState.userHandleB64u);
		} catch (error) {
			console.error('Error decoding state:', error);
			return false;
		}
	};

	if (!isLoggedIn) {
		if (state && userExistsInCache(state)) {
			return <Navigate to={`/login-state${window.location.search}`} replace />;
		} else {
			return <Navigate to={`/login${window.location.search}`} replace />;
		}
	}

	return (
		<>
			{children}
		</>
	);
};

export default PrivateRoute;
