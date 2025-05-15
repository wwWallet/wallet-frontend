import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faXmark } from '@fortawesome/pro-regular-svg-icons';

import { fetchToken, notificationApiIsSupported } from '../../firebase';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import { useSessionStorage } from '@/hooks/useStorage';

import Button from '@/components/Buttons/Button';
import Spinner from '@/components/Shared/Spinner';

type PrivateRouteContextValue = {
	isPermissionGranted: boolean | null,
	tokenSentInSession: boolean | null,
}

const PrivateRouteContext: React.Context<PrivateRouteContextValue> = createContext({
	isPermissionGranted: null,
	tokenSentInSession: null,
});


export function NotificationPermissionWarning(): React.ReactNode {
	//General
	useTranslation(); // This ensures reactivity to language changes
	const { api } = useContext(SessionContext);
	const { isOnline } = useContext(StatusContext);
	const { isPermissionGranted, tokenSentInSession } = useContext(PrivateRouteContext);

	//State
	const [isMessageNoGrantedVisible, setIsMessageNoGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageNoGrantedVisible', false));
	const [isMessageGrantedVisible, setIsMessageGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageGrantedVisible', false));
	const [isMessageOfflineVisible, setIsMessageOfflineVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageOfflineVisible', false));

	//Handlers
	const handleCloseMessageOffline = () => {
		setIsMessageOfflineVisible(true);
	};

	const handleCloseMessageNoGranted = () => {
		setIsMessageNoGrantedVisible(true);
	};

	const handleCloseMessageGranted = () => {
		setIsMessageGrantedVisible(true);
	};

	//Prepare for render
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

	//Render
	return (
		show
			? (
				<div className="bg-c-lm-gray-300 dark:bg-c-dm-gray-700 dark:border-b dark:border-b-c-dm-gray-800 dark:border-t dark:border-t-c-dm-gray-600 dark:shadow-lg rounded-xl p-4 m-4 flex items-center">
					<FontAwesomeIcon icon={faExclamationTriangle} className='text-2xl text-c-lm-orange dark:text-c-dm-orange mr-4 ml-1' />

					{isOnline === false && isMessageOfflineVisible === false && (
						<>
							<div className="flex-grow">
								<p className='text-sm text-c-lm-gray-900 dark:text-c-dm-gray-100'>
									<Trans
										i18nKey="layout.messageOffline"
										components={{ strong: <strong /> }}
									/>
								</p>
							</div>

							<button
								id="close-message-offline"
								className="mx-2 flex items-center justify-center"
								onClick={handleCloseMessageOffline}
							>
								<FontAwesomeIcon icon={faXmark} className='text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100 hover:text-c-lm-gray-800 dark:hover:text-c-dm-gray-200 transition-all duration-150' />
							</button>
						</>
					)}

					{isOnline === true && (
						<>
							{!isPermissionGranted && (
								<>
									<div className="flex-grow">
										<p className='text-sm text-c-lm-gray-900 dark:text-c-dm-gray-100'>
											<Trans
												i18nKey="layout.messageAllowPermission"
												components={{ 
													strong: <strong /> 
												}}
											/>
										</p>
									</div>

									<button
										id="close-message-no-granted"
										className="mx-2 flex items-center justify-center"
										onClick={handleCloseMessageNoGranted}
									>
										<FontAwesomeIcon icon={faXmark} className='text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100 hover:text-c-lm-gray-800 dark:hover:text-c-dm-gray-200 transition-all duration-150' />
									</button>
								</>
							)}

							{isPermissionGranted && tokenSentInSession === false && (
								<>
									<div className="flex-grow">
										<p className='text-sm text-c-lm-gray-900 dark:text-c-dm-gray-100'>
											<Trans
												i18nKey="layout.messageResetPermission"
												components={{
													strong: <strong />,
												}}
											/>
										</p>
									</div>

									<Button
										id="reset-notification-permission"
										variant="tertiary"
										onClick={() => window.location.reload()}
										size='md'
										textSize='md'
										additionalClassName='-my-1'
									>
										Reload
									</Button>

									<button
										id="close-message-granted"
										className="ml-5 mr-2 flex items-center justify-center"
										onClick={handleCloseMessageGranted}
									>
										<FontAwesomeIcon icon={faXmark} className='text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100 hover:text-c-lm-gray-800 dark:hover:text-c-dm-gray-200 transition-all duration-150' />
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
	const [latestIsOnlineStatus, setLatestIsOnlineStatus,] = api.useClearOnClearSession(useSessionStorage('latestIsOnlineStatus', null));
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

		if (isLoggedIn) {
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

		if (isOnline === true && isLoggedIn) {
			sendFcmTokenToBackend();
		} else if (isOnline === false) {
			setTokenSentInSession(false);
		}
	}, [
		api,
		isOnline,
		isPermissionGranted,
		setTokenSentInSession,
		tokenSentInSession,
		isLoggedIn,
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
