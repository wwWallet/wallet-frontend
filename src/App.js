// Import Libraries
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Spinner from './components/Spinner'; // Make sure this Spinner component exists and renders the spinner you want
// Import i18next and set up translations
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

import { CredentialsProvider } from './context/CredentialsContext';
import useCheckURL from './components/useCheckURL'; // Import the custom hook
import handleServerMessagesGuard from './hoc/handleServerMessagesGuard';
import HandlerNotification from './components/HandlerNotification';
import { withSessionContext } from './context/SessionContext';
import Snowfalling from './components/ChistmasAnimation/Snowfalling';

import Home from './pages/Home/Home';
import History from './pages/History/History';
import Settings from './pages/Settings/Settings';
import AddCredentials from './pages/AddCredentials/AddCredentials';
import SendCredentials from './pages/SendCredentials/SendCredentials';

const Login = React.lazy(() => import('./pages/Login/Login'));
const LoginState = React.lazy(() => import('./pages/Login/LoginState'));
const NotFound = React.lazy(() => import('./pages/NotFound/NotFound'));
const PrivateRoute = React.lazy(() => import('./components/PrivateRoute'));
const CredentialDetail = React.lazy(() => import('./pages/Home/CredentialDetail'));
const SelectCredentialsPopup = React.lazy(() => import('./components/Popups/SelectCredentials'));
const PinInputPopup = React.lazy(() => import('./components/Popups/PinInput'));
const MessagePopup = React.lazy(() => import('./components/Popups/MessagePopup'));
const VerificationResult = React.lazy(() => import('./pages/VerificationResult/VerificationResult'));

function App() {

	const url = window.location.href;
	const {
		showSelectCredentialsPopup,
		setShowSelectCredentialsPopup,
		setSelectionMap,
		conformantCredentialsMap,
		showPinInputPopup,
		setShowPinInputPopup,
		verifierDomainName,
		showMessagePopup,
		setMessagePopup,
		textMessagePopup,
		typeMessagePopup,
	} = useCheckURL(url);

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
			<CredentialsProvider>
				<Snowfalling />
				<Router>
					<Suspense fallback={<Spinner />}>
						<HandlerNotification />
						<Routes>
							<Route path="/login" element={<Login />} />
							<Route path="/login-state" element={<LoginState />} />
							<Route element={<PrivateRoute><Outlet /></PrivateRoute>}>
								<Route path="/settings" element={<Settings />} />
								<Route path="/" element={<Home />} />
								<Route path="/credential/:id" element={<CredentialDetail />} />
								<Route path="/history" element={<History />} />
								<Route path="/add" element={<AddCredentials />} />
								<Route path="/send" element={<SendCredentials />} />
								<Route path="/verification/result" element={<VerificationResult />} />
								<Route path="/cb" element={<Home />} />
							</Route>
							<Route path="*" element={<NotFound />} />
						</Routes>
						{showSelectCredentialsPopup &&
							<SelectCredentialsPopup showPopup={showSelectCredentialsPopup} setShowPopup={setShowSelectCredentialsPopup} setSelectionMap={setSelectionMap} conformantCredentialsMap={conformantCredentialsMap} verifierDomainName={verifierDomainName} />
						}
						{showPinInputPopup &&
							<PinInputPopup showPopup={showPinInputPopup} setShowPopup={setShowPinInputPopup} />
						}
						{showMessagePopup &&
							<MessagePopup type={typeMessagePopup} message={textMessagePopup} onClose={() => setMessagePopup(false)} />
						}
					</Suspense>
				</Router>
			</CredentialsProvider>
		</I18nextProvider>
	);
}

export default withSessionContext(handleServerMessagesGuard(App));
