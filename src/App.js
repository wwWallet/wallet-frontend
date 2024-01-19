// Import Libraries
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Spinner from './components/Spinner'; // Make sure this Spinner component exists and renders the spinner you want
// Import i18next and set up translations
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

import useCheckURL from './components/useCheckURL'; // Import the custom hook
import handleServerMessagesGuard from './hoc/handleServerMessagesGuard';
import HandlerNotification from './components/HandlerNotification';
import Snowfalling from './components/ChistmasAnimation/Snowfalling'

const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const Login = React.lazy(() => import('./pages/Login/Login'));
const Home = React.lazy(() => import('./pages/Home/Home'));
const AddCredentials = React.lazy(() => import('./pages/AddCredentials/AddCredentials'));
const SendCredentials = React.lazy(() => import('./pages/SendCredentials/SendCredentials'));
const History = React.lazy(() => import('./pages/History/History'));
const NotFound = React.lazy(() => import('./pages/NotFound/NotFound'));
const PrivateRoute = React.lazy(() => import('./components/PrivateRoute'));
const CredentialDetail = React.lazy(() => import('./pages/Home/CredentialDetail'));
const Popup = React.lazy(() => import('./components/Popup'));
const VerificationResult = React.lazy(() => import('./pages/VerificationResult/VerificationResult'));


// Check that service workers are supported
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/firebase-messaging-sw.js')
			.then(registration => {
				console.log('Service Worker registered! Scope is: ', registration.scope);
			})
			.catch(err => {
				console.log('Service Worker registration failed: ', err);
				// Add your error handling code here. For instance:
				alert('Failed to register service worker. Some features may not work properly.');
			});
	});
}

function App() {

	const url = window.location.href;
	const { isValidURL, showPopup, setShowPopup, setSelectedValue,conformantCredentialsMap } = useCheckURL(url);

	useEffect(() => {
		if (navigator?.serviceWorker) {
			navigator.serviceWorker.addEventListener('message', handleMessage);
			// Clean up the event listener when the component unmounts
			return () => {
				navigator.serviceWorker.removeEventListener('message', handleMessage);
			};
		}

	}, []);

	// Handle messages received from the service worker
	const handleMessage = (event) => {
		if (event.data.type === 'navigate') {
			// Remove any parameters from the URL
			const homeURL = window.location.origin + window.location.pathname;
			// Redirect the current tab to the home URL
			window.location.href = homeURL;
		}
	};
	return (
		<I18nextProvider i18n={i18n}>
		  <Snowfalling/>

			<Router>
				<Suspense fallback={<Spinner />}>
				<HandlerNotification>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
						<Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
						<Route path="/credential/:id" element={<PrivateRoute><CredentialDetail /></PrivateRoute>} />
						<Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
						<Route path="/add" element={<PrivateRoute><AddCredentials /></PrivateRoute>} />
						<Route path="/send" element={<PrivateRoute><SendCredentials /></PrivateRoute>} />
						<Route path="/verification/result" element={<PrivateRoute><VerificationResult /></PrivateRoute>} />
						<Route path="/cb" element={<PrivateRoute><Home /></PrivateRoute>} />
						<Route path="*" element={<NotFound />} />
					</Routes>
					{showPopup &&
						<Popup showPopup={showPopup} setShowPopup={setShowPopup} setSelectedValue={setSelectedValue} conformantCredentialsMap={conformantCredentialsMap} />
					}
					</HandlerNotification>
				</Suspense>
			</Router>
		</I18nextProvider>
	);
}

export default handleServerMessagesGuard(App);
