import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';
import { withLoginRedirect } from './loginRedirect';

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
		const search = withLoginRedirect(window.location.pathname, window.location.search);
		if (state && userExistsInCache(state)) {
			return <Navigate to={`/login-state${search}`} replace />;
		} else {
			return <Navigate to={`/login${search}`} replace />;
		}
	}

	return (
		<>
			{children}
		</>
	);
};

export default PrivateRoute;
