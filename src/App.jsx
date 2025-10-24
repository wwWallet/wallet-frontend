// App.jsx
import React, { Suspense } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';

import FadeInContentTransition from './components/Transitions/FadeInContentTransition';
import Snowfalling from './components/ChristmasAnimation/Snowfalling';
import Spinner from './components/Shared/Spinner';

import UpdateNotification from './components/Notifications/UpdateNotification';
import CredentialDetails from './pages/Home/CredentialDetails';
import BackgroundNotificationClickHandler from './components/Notifications/BackgroundNotificationClickHandler';

const lazyWithDelay = (importFunction, delay = 1000) => {
	return React.lazy(() =>
		Promise.all([
			importFunction(),
			new Promise((resolve) => setTimeout(resolve, delay)),
		]).then(([module]) => module)
	);
};

const PrivateRoute = React.lazy(() => import('./components/Auth/PrivateRoute'));
const NotificationOfflineWarning = React.lazy(() => import('./components/Notifications/NotificationOfflineWarning'));
const AddCredentials = React.lazy(() => import('./pages/AddCredentials/AddCredentials'));
const Credential = React.lazy(() => import('./pages/Home/Credential'));
const CredentialHistory = React.lazy(() => import('./pages/Home/CredentialHistory'));
const History = React.lazy(() => import('./pages/History/History'));
const Pending = React.lazy(() => import('./pages/Pending/Pending'));
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
	return (
		<>
			<BackgroundNotificationClickHandler />
			<Snowfalling />
			<Suspense fallback={<Spinner />}>
				<UpdateNotification />
				<Routes>
					<Route element={
						<PrivateRoute>
							<Layout>
								<Suspense fallback={<Spinner size='small' />}>
									<FadeInContentTransition appear reanimateKey={location.pathname}>
										<NotificationOfflineWarning />
										<Outlet />
									</FadeInContentTransition>
								</Suspense>
							</Layout>
						</PrivateRoute>
					}>
						<Route path="/settings" element={<Settings />} />
						<Route path="/" element={<Home />} />
						<Route path="/credential/:batchId" element={<Credential />} />
						<Route path="/credential/:batchId/history" element={<CredentialHistory />} />
						<Route path="/credential/:batchId/details" element={<CredentialDetails />} />
						<Route path="/history" element={<History />} />
						<Route path="/pending" element={<Pending />} />
						<Route path="/history/:transactionId" element={<HistoryDetail />} />
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
		</>
	);
}

export default App;
