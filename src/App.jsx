// App.jsx
import React, { Suspense, useMemo } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';

import FadeInContentTransition from './components/Transitions/FadeInContentTransition';
import Snowfalling from './components/ChristmasAnimation/Snowfalling';
import Spinner from './components/Shared/Spinner';

import UpdateNotification from './components/Notifications/UpdateNotification';
import CredentialDetails from './pages/Home/CredentialDetails';
import { TenantProvider } from './context/TenantContext';
import { isMultiTenant } from './lib/tenant';

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

const ProtectedLayout = () => {
	const location = useLocation();
	return (
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
	);
};

const PublicLayout = () => {
	const location = useLocation();
	return (
		<FadeInContentTransition reanimateKey={location.pathname}>
			<Outlet />
		</FadeInContentTransition>
	);
}

/**
 * Authenticated route definitions.
 * Returns an array of Route elements for use in both tenant-scoped and global contexts.
 * Uses relative paths which React Router resolves against the parent route.
 * @param prefix - Optional path prefix ("/" for global routes, "" for nested routes)
 */
const authenticatedRoutes = [
	<Route key="home" index element={<Home />} />,
	<Route key="settings" path="settings" element={<Settings />} />,
	<Route key="credential" path="credential/:batchId" element={<Credential />} />,
	<Route key="credential-history" path="credential/:batchId/history" element={<CredentialHistory />} />,
	<Route key="credential-details" path="credential/:batchId/details" element={<CredentialDetails />} />,
	<Route key="history" path="history" element={<History />} />,
	<Route key="pending" path="pending" element={<Pending />} />,
	<Route key="history-detail" path="history/:transactionId" element={<HistoryDetail />} />,
	<Route key="add" path="add" element={<AddCredentials />} />,
	<Route key="send" path="send" element={<SendCredentials />} />,
	<Route key="verification" path="verification/result" element={<VerificationResult />} />,
	<Route key="cb" path="cb/*" element={<Home />} />,
];

/**
 * Public route definitions.
 */
const publicRoutes = [
	<Route key="login" path="login" element={<Login />} />,
	<Route key="login-state" path="login-state" element={<LoginState />} />,
	<Route key="not-found" path="*" element={<NotFound />} />,
];

function App() {
	const multiTenant = useMemo(() => isMultiTenant(), []);
	const routeWrapper = useMemo(
		() => (multiTenant
			? <TenantProvider><Outlet /></TenantProvider>
			: <Outlet />
		),
		[multiTenant],
	);
	const basePath = useMemo(
		() => multiTenant ? '/id/:tenantId/*' : '/*',
		[multiTenant]
	);

	return (
		<>
			<Snowfalling />
			<Suspense fallback={<Spinner />}>
				<UpdateNotification />
				<Routes>
					<Route path={basePath} element={routeWrapper}>
						<Route element={<ProtectedLayout />}>
							{authenticatedRoutes}
						</Route>
						<Route element={<PublicLayout/>}>
							{publicRoutes}
						</Route>
					</Route>
				</Routes>
			</Suspense>
		</>
	);
}

export default App;
