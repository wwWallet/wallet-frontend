import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import decode from 'jwt-decode';

type AuthProps = {
    children: JSX.Element,
    loginGuard?: boolean
};

// authguard
const AuthGuard: React.FC<AuthProps> = ({children, loginGuard}) => {

    const location = useLocation();
    const apptoken = localStorage.getItem("apptoken");
  
    const isAuthenticated = () => {
      console.log('path = ', location.pathname, '   ',  window.location.href)
      if (apptoken != "undefined" && apptoken != null && apptoken != "") {
        console.log('AAA,  = ', apptoken)

        const { exp } = decode<{exp: number}>(apptoken);
        console.log('exp = ', exp);
        if (Date.now() >= exp * 1000) {
          console.log('is not authenticated')
  
          return false; // has expired
        }
        else {
          console.log('is authenticated')
          return true;
        }
      }
      else {
        console.log('false')
        return false;
      }
      
    }
  
    // useEffect(() => {
    //   isAuthenticated()
    // }, []);
    if ((loginGuard == undefined || loginGuard == null)) {
      return isAuthenticated() === true 
          ? children
          : (
              <Navigate to="/login" replace state={{ path: window.location.href.substring(window.location.href.indexOf(location.pathname)) }} />
          );
    }
    else {
      return isAuthenticated() === false 
          ? children // always Login component
          : (
              <Navigate to="/" replace state={{ path: window.location.href.substring(window.location.href.indexOf(location.pathname)) }} />
          );
    }
    // return <Navigate to="/auth" replace state={{ path: window.location.href }}/>
}

export default AuthGuard;