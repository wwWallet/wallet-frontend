import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as api from '../api';
import { fetchToken } from '../firebase';

const PrivateRoute = ({ children }) => {
  const isLoggedIn = api.isLoggedIn();
  const location = useLocation();


	
  useEffect(() => {
    if (isLoggedIn) {
      const requestNotificationPermission = async () => {
        try {
          if (Notification.permission !== 'granted') {
            const permissionResult = await Notification.requestPermission();
            if (permissionResult === 'granted') {
              // If permission is granted
              const fcm_token = await fetchToken();
              // console.log('GIVE PERMISSION with token', fcm_token);
              // Call an API function to store the token
							await api.post('/user/session/fcm_token/add', { fcm_token });
            }
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      };

      requestNotificationPermission();
    }
  }, [isLoggedIn, location.pathname]);

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
