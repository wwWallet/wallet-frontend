
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import decode from 'jwt-decode';

const Authguard: any = (WrappedComponent: any, selectData: any) => {

    const WrapperComp: any = (props: any) => {
			const apptoken = localStorage.getItem("appToken");

			const checkIsAuthenticated = () => {
				// console.log('path = ', location.pathname, '   ',  window.location.href)
				if (apptoken != "undefined" && apptoken != null && apptoken != "") {
					console.log('AAA,  = ', apptoken)

					const { exp } = decode<{exp: number}>(apptoken);
					console.log('exp = ', exp);
					if (Date.now() >= exp * 1000) {
						console.log('is not authenticated')
		
						return false; // has expired
					}
					else {
						console.log('is authenticated in new authguard')
						return true;
					}
				}
				else {
					console.log('false')
					return false;
				}
				
			}

			return (
				<>
						{checkIsAuthenticated() == true ? 
								<WrappedComponent {...props} /> :
								<><Navigate to={'/login'} replace /> </>
						}
				</>
			);
    }
		return WrapperComp;
}


export default Authguard;