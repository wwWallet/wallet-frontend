import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {

	const navigate = useNavigate();

	useEffect(() => {
		localStorage.setItem('appToken', '');
		navigate('/login');

	}, [])

	return (<React.Fragment />);
}

export default Logout;