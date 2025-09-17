import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { fetchToken, notificationApiIsSupported } from '../../firebase';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';

import Spinner from '../Shared/Spinner'; // Import your spinner component
import { useSessionStorage } from '../../hooks/useStorage';
import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import * as config from '../../config';


type PrivateRouteContextValue = {
	isPermissionGranted: boolean | null,
	tokenSentInSession: boolean | null,
}

const PrivateRouteContext: React.Context<PrivateRouteContextValue> = createContext({
	isPermissionGranted: null,
	tokenSentInSession: null,
});


export function NotificationPermissionWarning(): React.ReactNode {
	useTranslation(); // This ensures reactivity to language changes

	const { isOnline } = useContext(StatusContext);
	const { api } = useContext(SessionContext);
	const [isMessageNoGrantedVisible, setIsMessageNoGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageNoGrantedVisible', false));
	const [isMessageGrantedVisible, setIsMessageGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageGrantedVisible', false));
	const [isMessageOfflineVisible, setIsMessageOfflineVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageOfflineVisible', false));

	const { isPermissionGranted, tokenSentInSession } = useContext(PrivateRouteContext);

	const handleCloseMessageOffline = () => {
		setIsMessageOfflineVisible(true);
	};

	const handleCloseMessageNoGranted = () => {
		setIsMessageNoGrantedVisible(true);
	};

	const handleCloseMessageGranted = () => {
		setIsMessageGrantedVisible(true);
	};

	const show = (
		(isOnline === false && isMessageOfflineVisible === false)
		|| (
			isOnline === true
			&& isPermissionGranted != null
			&& notificationApiIsSupported
			&& (
				(!isPermissionGranted && isMessageNoGrantedVisible === false)
				|| (
					isPermissionGranted
					&& tokenSentInSession === false
					&& isMessageGrantedVisible === false)
			))
	);

	return (
		show
			? (
				<div className="bg-orange-100 shadow-lg p-4 rounded-lg mb-4 flex items-center">
					<div className="mr-4 text-orange-500">
						<FaExclamationTriangle size={24} />
					</div>

					{isOnline === false && isMessageOfflineVisible === false && (
						<>
							<div className="flex-grow">
								<p className='text-sm'>
									<Trans
										i18nKey="layout.messageOffline"
										components={{ strong: <strong /> }}
									/>
								</p>
							</div>
							<button
								id="close-message-offline"
								className="ml-2 text-gray-800"
								onClick={handleCloseMessageOffline}
							>
								<FaTimes size={24} />
							</button>
						</>
					)}
					{isOnline === true && (
						<>
							{!isPermissionGranted && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											<Trans
												i18nKey="layout.messageAllowPermission"
												components={{ strong: <strong /> }}
											/>
										</p>
									</div>
									<button
										id="close-message-no-granted"
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageNoGranted}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}
							{isPermissionGranted && tokenSentInSession === false && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											<Trans
												i18nKey="layout.messageResetPermission"
												components={{
													strong: <strong />,
													reloadButton:
														<button
															id="reset-notification-permission"
															className='text-primary underline'
															onClick={() => window.location.reload()}
														/>,
												}}
											/>
										</p>
									</div>
									<button
										id="close-message-granted"
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageGranted}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}
						</>
					)}
				</div>
			)
			: <></>
	);
}

const PrivateRoute = ({ children }: { children?: React.ReactNode }): React.ReactNode => {
	const { isOnline } = useContext(StatusContext);
	const { api, isLoggedIn, keystore, logout } = useContext(SessionContext);
	const [isPermissionGranted, setIsPermissionGranted] = useState(null);
	const [loading, setLoading] = useState(false);
	const [tokenSentInSession, setTokenSentInSession,] = api.useClearOnClearSession(useSessionStorage('tokenSentInSession', null));
	const cachedUsers = keystore.getCachedUsers();

	const location = useLocation();
	const queryParams = new URLSearchParams(window.location.search);
	const state = queryParams.get('state');

	useEffect(() => {
		const requestNotificationPermission = async () => {
			if (!notificationApiIsSupported) {
				setIsPermissionGranted(false);
				setTokenSentInSession(false);
				return;
			}

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

		if (isLoggedIn && config.FIREBASE_ENABLED) {
			requestNotificationPermission();
		}
	}, [isLoggedIn, location, setTokenSentInSession]);

	useEffect(() => {
		const sendFcmTokenToBackend = async () => {
			if (isPermissionGranted) {
				if (!tokenSentInSession) {
					setLoading(true);
					try {
						const fcmToken = await fetchToken();
						if (fcmToken !== null) {
							await api.post('/user/session/fcm_token/add', { fcm_token: fcmToken });
							setTokenSentInSession(true);
							console.log('FCM Token send:', fcmToken);
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

		if (!config.FIREBASE_ENABLED || isOnline === false) {
			setTokenSentInSession(false);
		}
		else if (isOnline === true && isLoggedIn) {
			sendFcmTokenToBackend();
		}
	}, [
		api,
		isOnline,
		isPermissionGranted,
		setTokenSentInSession,
		tokenSentInSession,
		isLoggedIn,
	]);

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

	if (loading || tokenSentInSession === null) {
		return (
			<Spinner />
		);
	}
	else {
		return (
			<PrivateRouteContext.Provider value={{ isPermissionGranted, tokenSentInSession }}>
				{children}
			</PrivateRouteContext.Provider>
		);
	}
};

export default PrivateRoute;
