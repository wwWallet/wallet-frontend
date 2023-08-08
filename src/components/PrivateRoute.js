import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

const PrivateRoute = ({ children }) => {
	const isLoggedIn = Cookies.get('loggedIn');
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
