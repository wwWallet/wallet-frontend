// App.jsx
import React, { Suspense } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';

import FadeInContentTransition from './components/Transitions/FadeInContentTransition';
import Snowfalling from './components/ChristmasAnimation/Snowfalling';
import Spinner from './components/Shared/Spinner';

import UpdateNotification from './components/Notifications/UpdateNotification';
import CredentialDetails from './pages/Home/CredentialDetails';
import { TenantProvider } from './context/TenantContext';

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

/**
 * Protected routes layout - wraps authenticated content with Layout and transitions.
 * Used for both global routes (/) and tenant-scoped routes (/:tenantId/).
 */
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

/**
 * Authenticated route definitions.
 * Returns an array of Route elements for use in both tenant-scoped and global contexts.
 * Uses relative paths which React Router resolves against the parent route.
 * @param prefix - Optional path prefix ("/" for global routes, "" for nested routes)
 */
const authenticatedRoutes = (prefix = "") => [
	<Route key="home" path={`${prefix}` || undefined} index={!prefix} element={<Home />} />,
	<Route key="settings" path={`${prefix}settings`} element={<Settings />} />,
	<Route key="credential" path={`${prefix}credential/:batchId`} element={<Credential />} />,
	<Route key="credential-history" path={`${prefix}credential/:batchId/history`} element={<CredentialHistory />} />,
	<Route key="credential-details" path={`${prefix}credential/:batchId/details`} element={<CredentialDetails />} />,
	<Route key="history" path={`${prefix}history`} element={<History />} />,
	<Route key="pending" path={`${prefix}pending`} element={<Pending />} />,
	<Route key="history-detail" path={`${prefix}history/:transactionId`} element={<HistoryDetail />} />,
	<Route key="add" path={`${prefix}add`} element={<AddCredentials />} />,
	<Route key="send" path={`${prefix}send`} element={<SendCredentials />} />,
	<Route key="verification" path={`${prefix}verification/result`} element={<VerificationResult />} />,
	<Route key="cb" path={`${prefix}cb/*`} element={<Home />} />,
];

function App() {
	const location = useLocation();
	return (
		<>
			<Snowfalling />
			<Suspense fallback={<Spinner />}>
				<UpdateNotification />
				<Routes>
					{/*
					 * Tenant-scoped routes (/id/:tenantId/*)
					 * These routes extract the tenant ID from the URL path and provide it
					 * via TenantContext. Used for multi-tenant deployments where users
					 * access the wallet via tenant-specific URLs like /id/acme-corp/login.
					 *
					 * URL Structure:
					 * - Default tenant: /* (backwards compatible root paths)
					 * - Custom tenants: /id/{tenantId}/* (prefixed paths)
					 */}
					<Route path="/id/:tenantId/*" element={<TenantProvider><Outlet /></TenantProvider>}>
						{/* Tenant-scoped protected routes */}
						<Route element={<ProtectedLayout />}>
							{authenticatedRoutes()}
						</Route>
						{/* Tenant-scoped public routes */}
						<Route element={
							<FadeInContentTransition reanimateKey={location.pathname}>
								<Outlet />
							</FadeInContentTransition>
						}>
							<Route path="login" element={<Login />} />
							<Route path="login-state" element={<LoginState />} />
							<Route path="*" element={<NotFound />} />
						</Route>
					</Route>

					{/*
					 * Global routes (no tenant prefix)
					 * These routes are used for:
					 * 1. Single-tenant deployments (backward compatible)
					 * 2. Global login page where tenant is discovered from passkey
					 * 3. Returning users who already have passkeys
					 */}
					<Route element={<ProtectedLayout />}>
						{authenticatedRoutes("/")}
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
