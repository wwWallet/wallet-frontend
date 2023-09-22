import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useApi } from '../api';


const PrivateRoute = ({ children }) => {
	const api = useApi();
	const isLoggedIn = api.isLoggedIn();
	const location = useLocation();

	// const handleauthrespn{

	// 	//take url req to bck handleAuthorizationResponse
	// 	//if 200 go to root /
	// }

	if (!isLoggedIn) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return children;
};

export default PrivateRoute;
