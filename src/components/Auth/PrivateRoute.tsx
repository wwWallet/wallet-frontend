import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SessionContext from '@/context/SessionContext';

const PrivateRoute = ({ children }) => {
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const location = useLocation();
	const cachedUsers = keystore.getCachedUsers();
	const queryParams = new URLSearchParams(location.search);
	const state = queryParams.get('state');
	const userExistsInCache = (stateParam) => {
		if (!stateParam) return false;
		try {
			const decodedState = JSON.parse(atob(stateParam));
			return cachedUsers.some(user => user.userHandleB64u === decodedState.userHandleB64u);
		} catch (error) {
			return false;
		}
	};
	if (!isLoggedIn) {
		const loginPath = (state && userExistsInCache(state)) ? '/login-state' : '/login';
		return (<Navigate to={`${loginPath}${location.search}`} state={{ from: location }} replace />);
	}
	return <>{children}</>;
};

export default PrivateRoute;
