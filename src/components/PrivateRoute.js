import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useApi } from '../api';

const PrivateRoute = ({ children }) => {
  const api = useApi();
  const isLoggedIn = api.isLoggedIn();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      const destination = location.pathname + location.search;
      navigate('/login', { state: { from: destination } });
    }
  }, [isLoggedIn, location, navigate]);

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
