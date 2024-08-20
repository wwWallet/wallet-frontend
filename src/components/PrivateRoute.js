import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApi } from '../api';
import { fetchToken } from '../firebase';
import Layout from './Layout';
import Spinner from './Spinner'; // Import your spinner component
import { useSessionStorage } from '../components/useStorage';
import OnlineStatusContext from '../context/OnlineStatusContext';
import SessionContext from '../context/SessionContext';

const PrivateRoute = ({ children }) => {
	const { isOnline } = useContext(OnlineStatusContext);
	const { isLoggedIn, keystore, logout } = useContext(SessionContext);
	const api = useApi(isOnline);
	const [isPermissionGranted, setIsPermissionGranted] = useState(null);
	const [loading, setLoading] = useState(false);
	const [tokenSentInSession, setTokenSentInSession,] = api.useClearOnClearSession(useSessionStorage('tokenSentInSession', null));
	const [latestIsOnlineStatus, setLatestIsOnlineStatus,] = api.useClearOnClearSession(useSessionStorage('latestIsOnlineStatus', null));
	const cachedUsers = keystore.getCachedUsers();

	const location = useLocation();
	const queryParams = new URLSearchParams(window.location.search);
	const state = queryParams.get('state');

	useEffect(() => {
		const requestNotificationPermission = async () => {
			console.log(Notification.permission);

			try {
				if (Notification.permission !== 'granted') {
					setTokenSentInSession(false);
					setIsPermissionGranted(false);
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
	}, [isLoggedIn, location, setTokenSentInSession]);

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
							setTokenSentInSession(true);
							console.log('FCM Token success:', fcmToken);
						} else {
							console.log('FCM Token failed to get fcmtoken in private route', fcmToken);
							setTokenSentInSession(false);
						}
					} catch (error) {
						console.error('Error sending FCM token to the backend:', error);
					} finally {
						setLoading(false);
					}
				}
			}
		};

		console.log("is online = ", isOnline);
		if (isOnline) {
			sendFcmTokenToBackend();
		} else {
			setTokenSentInSession(false);
		}
	}, [
		api,
		isOnline,
		isPermissionGranted,
		setTokenSentInSession,
		tokenSentInSession,
	]);

	useEffect(() => {
		if (latestIsOnlineStatus === false && isOnline === true) {
			logout();
		}
		if (isLoggedIn) {
			setLatestIsOnlineStatus(isOnline);
		} else {
			setLatestIsOnlineStatus(null);
		}
	}, [
		api,
		isLoggedIn,
		isOnline,
		logout,
		latestIsOnlineStatus,
		setLatestIsOnlineStatus,
	]);


	const userExistsInCache = (state) => {
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
			return <Navigate to="/login-state" state={{ from: location }} replace />;
		} else {
			return <Navigate to="/login" state={{ from: location }} replace />;
		}
	}

	if (loading || tokenSentInSession === null) {
		return (
			<Spinner />
		);
	}
	else {
		return (
			<Layout isPermissionGranted={isPermissionGranted} tokenSentInSession={tokenSentInSession}>
				{children}
			</Layout>
		);
	}

};

export default PrivateRoute;
