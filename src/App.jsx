// App.jsx
import React, { Suspense } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';

import FadeInContentTransition from './components/Transitions/FadeInContentTransition';
import Snowfalling from './components/ChristmasAnimation/Snowfalling';
import Spinner from './components/Shared/Spinner';

import UpdateNotification from './components/Notifications/UpdateNotification';
import CredentialDetails from './pages/Home/CredentialDetails';
import Register from './pages/Auth/Register';

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
const ResyncNotification = React.lazy(() => import('./components/Notifications/ResyncNotification'));
const AddCredentials = React.lazy(() => import('./pages/AddCredentials/AddCredentials'));
const Credential = React.lazy(() => import('./pages/Home/Credential'));
const CredentialHistory = React.lazy(() => import('./pages/Home/CredentialHistory'));
const Activity = React.lazy(() => import('./pages/History/History'));
const Pending = React.lazy(() => import('./pages/Pending/Pending'));
const ActivityDetail = React.lazy(() => import('./pages/History/HistoryDetail'));
const Home = React.lazy(() => import('./pages/Home/Home'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));
const VerificationResult = React.lazy(() => import('./pages/VerificationResult/VerificationResult'));

const Layout = lazyWithDelay(() => import('./components/Layout/Layout'), 400);
const Login = lazyWithDelay(() => import('./pages/Auth/Login'), 200);
const LoginState = lazyWithDelay(() => import('./pages/Auth/LoginState'), 400);
const NotFound = lazyWithDelay(() => import('./pages/NotFound/NotFound'), 400);

function App() {
	const location = useLocation();
	return (
		<>
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
										<ResyncNotification />
										<Outlet />
									</FadeInContentTransition>
								</Suspense>
							</Layout>
						</PrivateRoute>
					}>
						<Route path="/settings" element={<Settings />} />
						<Route path="/" element={<Home />} />
						<Route path="/credential/:batchId" element={<Credential />} />
						<Route path="/credential/:batchId/activity" element={<CredentialHistory />} />
						<Route path="/credential/:batchId/details" element={<CredentialDetails />} />
						<Route path="/activity" element={<Activity />} />
						<Route path="/pending" element={<Pending />} />
						<Route path="/activity/:transactionId" element={<ActivityDetail />} />
						<Route path="/add" element={<AddCredentials />} />
						<Route path="/verification/result" element={<VerificationResult />} />
						<Route path="/cb/*" element={<Home />} />
					</Route>
					<Route element={
						<FadeInContentTransition reanimateKey={location.pathname}>
							<Outlet />
						</FadeInContentTransition>
					}>
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
						<Route path="/login-state" element={<LoginState />} />
						<Route path="*" element={<NotFound />} />
					</Route>
				</Routes>
			</Suspense>
		</>
	);
}

export default App;
