import React from "react";
import Authguard from "../Authguard/Authguard";
import { checkIsAuthenticated } from "../Authguard/Authguard";

const LogoutIcon: React.FC = () => {

	const isAuthenticated: boolean = checkIsAuthenticated();

	return (
		isAuthenticated
			?
			<a href="/logout" className="fa fa-sign-out logout" />
			:
			<React.Fragment />
	);
}

export default Authguard(LogoutIcon, null);