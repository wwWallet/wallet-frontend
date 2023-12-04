import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as api from '../api';
import { fetchToken } from '../firebase';

const PrivateRoute = ({ children }) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const isLoggedIn = api.isLoggedIn();
  const location = useLocation();

  useEffect(() => {
    const requestNotificationPermission = async () => {
      console.log(Notification.permission);
      try {
        if (Notification.permission !== 'granted') {
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
  }, [isLoggedIn,location]);

	useEffect(() => {
		const sendFcmTokenToBackend = async () => {
			if (isPermissionGranted) {
				// Check if the token has already been sent in the current session
				const tokenSentInSession = sessionStorage.getItem('tokenSentInSession');
	
				if (!tokenSentInSession) {
					try {
						const fcmToken = await fetchToken();
						console.log('FCM Token:', fcmToken);
						await api.post('/user/session/fcm_token/add', { fcm_token: fcmToken });
	
						// Set a flag in sessionStorage to indicate that the token has been sent
						sessionStorage.setItem('tokenSentInSession', 'true');
	
						console.log('send FCM Token:', fcmToken);
					} catch (error) {
						console.error('Error sending FCM token to the backend:', error);
					}
				}
			}
		};
	
		sendFcmTokenToBackend();
	}, [isPermissionGranted]);

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;