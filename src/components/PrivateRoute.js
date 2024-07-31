import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApi } from '../api';
import { fetchToken } from '../firebase';
import Layout from './Layout';
import Spinner from './Spinner'; // Import your spinner component
import { useSessionStorage } from '../components/useStorage';
import SessionContext from '../context/SessionContext';

const PrivateRoute = ({ children }) => {
	const { isLoggedIn } = useContext(SessionContext);
	const api = useApi();
	const [isPermissionGranted, setIsPermissionGranted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [tokenSentInSession, setTokenSentInSession,] = api.useClearOnClearSession(useSessionStorage('tokenSentInSession', null));

	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		const requestNotificationPermission = async () => {
			console.log(Notification.permission);

			try {
				if (Notification.permission !== 'granted') {
					setTokenSentInSession(false)
					const permissionResult = await Notification.requestPermission();
					if (permissionResult === 'granted') {
						setIsPermissionGranted(true);
					}
				} else {
					setIsPermissionGranted(true);
				}
			} catch (error) {
				console.error('Error requesting notification permission:', error);
			}
		};

		if (isLoggedIn) {
			requestNotificationPermission();
		}
	}, [isLoggedIn, location]);

	useEffect(() => {
		const sendFcmTokenToBackend = async () => {
			console.log('isPermissionGranted:', isPermissionGranted);
			if (isPermissionGranted) {
				console.log('tokenSentInSession:', tokenSentInSession);

				if (!tokenSentInSession) {
					setLoading(true);
					try {
						const fcmToken = await fetchToken();
						if (fcmToken !== null) {
							await api.post('/user/session/fcm_token/add', { fcm_token: fcmToken });
							setTokenSentInSession(true)
							console.log('FCM Token success:', fcmToken);
						} else {
							console.log('FCM Token failed to get fcmtoken in private route', fcmToken);
						}
					} catch (error) {
						console.error('Error sending FCM token to the backend:', error);
					} finally {
						setLoading(false);
					}
				}
			}
		}

		sendFcmTokenToBackend();
	}, [isPermissionGranted]);


	useEffect(() => {
		if (!isLoggedIn) {
			const destination = location.pathname + location.search;
			navigate('/login', { state: { from: destination } });
		}
	}, [isLoggedIn, location, navigate]);


	if (!isLoggedIn) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return (
		<>
			{loading && <Spinner />}
			{!loading && (
				<Layout isPermissionGranted={isPermissionGranted} tokenSentInSession={tokenSentInSession}>
					{children}
				</Layout>
			)}
		</>
	);

};

export default PrivateRoute;
