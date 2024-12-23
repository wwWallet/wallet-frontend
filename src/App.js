import React, { useEffect, Suspense, useState, useContext } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
// Import i18next and set up translations
import { I18nextProvider } from 'react-i18next';

import i18n from './i18n';
import { withSessionContext } from './context/SessionContext';

import FadeInContentTransition from './components/Transitions/FadeInContentTransition';
import HandlerNotification from './components/Notifications/HandlerNotification';
import Snowfalling from './components/ChristmasAnimation/Snowfalling';
import Spinner from './components/Shared/Spinner';

import { withContainerContext } from './context/ContainerContext';
import { withCredentialsContext } from './context/CredentialsContext';

import UpdateNotification from './components/Notifications/UpdateNotification';
import CredentialDetails from './pages/Home/CredentialDetails';
import { withUriHandler } from './UriHandler';
import { withCredentialParserContext } from './context/CredentialParserContext';
import { withOpenID4VPContext } from './context/OpenID4VPContext';

const reactLazyWithNonDefaultExports = (load, ...names) => {
	const nonDefaults = (names ?? []).map(name => {
		const handles = {
			name,
			resolve: null,
			reject: null,
			promise: null,
		};
		handles.promise = new Promise((resolve, reject) => {
			handles.resolve = resolve;
			handles.reject = reject;
		});
		return handles;
	});

	const loadDefault = () => {
		return load()
			.then(module => {
				nonDefaults.forEach(({ name, resolve }) => {
					resolve({ default: module[name] });
				});
				return module;
			})
			.catch(err => {
				nonDefaults.forEach(({ reject }) => {
					reject(err);
				});
				return Promise.reject(err);
			});
	};

	const defaultExport = React.lazy(loadDefault);
	nonDefaults.forEach(({ promise, name }) => {
		defaultExport[name] = React.lazy(() => promise);
	});
	return defaultExport;
};

const lazyWithDelay = (importFunction, delay = 1000) => {
	return React.lazy(() =>
		Promise.all([
			importFunction(),
			new Promise((resolve) => setTimeout(resolve, delay)),
		]).then(([module]) => module)
	);
};

const MessagePopup = React.lazy(() => import('./components/Popups/MessagePopup'));
const PinInputPopup = React.lazy(() => import('./components/Popups/PinInput'));
const PrivateRoute = reactLazyWithNonDefaultExports(
	() => import('./components/Auth/PrivateRoute'),
	'NotificationPermissionWarning',
);
const AddCredentials = React.lazy(() => import('./pages/AddCredentials/AddCredentials'));
const Credential = React.lazy(() => import('./pages/Home/Credential'));
const CredentialHistory = React.lazy(() => import('./pages/Home/CredentialHistory'));
const History = React.lazy(() => import('./pages/History/History'));
const HistoryDetail = React.lazy(() => import('./pages/History/HistoryDetail'));
const Home = React.lazy(() => import('./pages/Home/Home'));
const SendCredentials = React.lazy(() => import('./pages/SendCredentials/SendCredentials'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const VerificationResult = React.lazy(() => import('./pages/VerificationResult/VerificationResult'));

const Layout = lazyWithDelay(() => import('./components/Layout/Layout'), 400);
const Login = lazyWithDelay(() => import('./pages/Login/Login'), 400);
const LoginState = lazyWithDelay(() => import('./pages/Login/LoginState'), 400);
const NotFound = lazyWithDelay(() => import('./pages/NotFound/NotFound'), 400);

function App() {
	const location = useLocation();
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
			<Snowfalling />
			<Suspense fallback={<Spinner />}>
				<HandlerNotification />
				<UpdateNotification />
				<Routes>
					<Route element={
						<PrivateRoute>
							<Layout>
								<Suspense fallback={<Spinner size='small' />}>
									<PrivateRoute.NotificationPermissionWarning />
									<FadeInContentTransition appear reanimateKey={location.pathname}>
										<Outlet />
									</FadeInContentTransition>
								</Suspense>
							</Layout>
						</PrivateRoute>
					}>
						<Route path="/settings" element={<Settings />} />
						<Route path="/" element={<Home />} />
						<Route path="/credential/:credentialId" element={<Credential />} />
						<Route path="/credential/:credentialId/history" element={<CredentialHistory />} />
						<Route path="/credential/:credentialId/details" element={<CredentialDetails />} />
						<Route path="/history" element={<History />} />
						<Route path="/history/:historyId" element={<HistoryDetail />} />
						<Route path="/add" element={<AddCredentials />} />
						<Route path="/send" element={<SendCredentials />} />
						<Route path="/verification/result" element={<VerificationResult />} />
						<Route path="/cb/*" element={<Home />} />
					</Route>
					<Route element={
						<FadeInContentTransition reanimateKey={location.pathname}>
							<Outlet />
						</FadeInContentTransition>
					}>
						<Route path="/login" element={<Login />} />
						<Route path="/login-state" element={<LoginState />} />
						<Route path="*" element={<NotFound />} />
					</Route>
				</Routes>
			</Suspense>
		</I18nextProvider>
	);
}

export default withSessionContext(
		withCredentialsContext(
			withCredentialParserContext(
				withOpenID4VPContext(
					withUriHandler(
						App
					)
				)
			)
		)
	);
