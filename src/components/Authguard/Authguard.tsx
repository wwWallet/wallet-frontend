
import { Navigate, useLocation } from "react-router-dom";

import decode from 'jwt-decode';

export const checkIsAuthenticated = (): boolean => {
	const apptoken = localStorage.getItem("appToken");
	if (apptoken != "undefined" && apptoken != null && apptoken != "") {
		const { exp } = decode<{ exp: number }>(apptoken);
		if (Date.now() >= exp * 1000) {
			console.log('is not authenticated')
			return false; // has expired
		}
		else {
			console.log('is authenticated in new authguard')
			return true;
		}
	}
	else {
		return false;
	}
}

const Authguard: any = (WrappedComponent: any, selectData: any) => {

	const WrapperComp: any = (props: any) => {
		const location = useLocation();

		if (location.pathname != '/login') {
			if (checkIsAuthenticated() == true)
				return <WrappedComponent {...props} />
			else
				return <Navigate to={'/login'} replace state={{ path: window.location.href.substring(window.location.href.indexOf(location.pathname)) }} />
		}
		else {
			if (checkIsAuthenticated() == false)
				return <WrappedComponent {...props} />
			else
				return <Navigate to="/" replace state={{ path: window.location.href.substring(window.location.href.indexOf(location.pathname)) }} />
		}

	}
	return WrapperComp;
}


export default Authguard;