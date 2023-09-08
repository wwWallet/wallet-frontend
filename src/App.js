// Import Libraries
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Spinner from './components/Spinner'; // Make sure this Spinner component exists and renders the spinner you want
// Import i18next and set up translations
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json'; // Import translation files for each language
import elTranslation from './locales/el.json';
import useCheckURL from './components/useCheckURL'; // Import the custom hook
import Notification from './components/Notification'; // Import the custom hook

const AccountSettings = React.lazy(() => import('./pages/AccountSettings/AccountSettings'));
const Login = React.lazy(() => import('./pages/Login/Login'));
const Home = React.lazy(() => import('./pages/Home/Home'));
const Issuers = React.lazy(() => import('./pages/Issuers/Issuers'));
const Verifiers = React.lazy(() => import('./pages/Verifiers/Verifiers'));
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

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: enTranslation },
			el: { translation: elTranslation }
		},
		fallbackLng: 'en',
		debug: false,
		interpolation: {
			escapeValue: false
		}
	});

function App() {

	const url = window.location.href;
	const { isValidURL, showPopup, setShowPopup, setSelectedValue,conformantCredentialsMap } = useCheckURL(url);

	useEffect(() => {
		navigator.serviceWorker.addEventListener('message', handleMessage);

		// Clean up the event listener when the component unmounts
		return () => {
			navigator.serviceWorker.removeEventListener('message', handleMessage);
		};
	}, []);

	// Handle messages received from the service worker
	const handleMessage = (event) => {
		if (event.data.type === 'navigate') {
			// Remove any parameters from the URL
			const homeURL = window.location.origin + window.location.pathname;
			console.log('-->',homeURL);
			// Redirect the current tab to the home URL
			window.location.href = homeURL;
		}
	};
	return (
		<I18nextProvider i18n={i18n}>
			<Router>
				<Suspense fallback={<Spinner />}>
					<Routes>
						<Route path="/login" element={<Login />} />
						<Route path="/account" element={<AccountSettings />} />
						<Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
						<Route path="/credential/:id" element={<PrivateRoute><CredentialDetail /></PrivateRoute>} />
						<Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
						<Route path="/issuers" element={<PrivateRoute><Issuers /></PrivateRoute>} />
						<Route path="/verifiers" element={<PrivateRoute><Verifiers /></PrivateRoute>} />
						<Route path="/verification/result" element={<PrivateRoute><VerificationResult /></PrivateRoute>} />

						<Route path="/cb"
							element={
								isValidURL === null ? null : isValidURL ? (
									<PrivateRoute><Home /></PrivateRoute>
								) : (
									<NotFound />
								)
							}
						/>
					</Routes>
					<Notification />
					{showPopup &&
						<Popup showPopup={showPopup} setShowPopup={setShowPopup} setSelectedValue={setSelectedValue} conformantCredentialsMap={conformantCredentialsMap} />
					}
				</Suspense>
			</Router>
		</I18nextProvider>
	);
}

export default App;
