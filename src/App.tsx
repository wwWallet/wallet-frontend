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
import { HocProvider } from './HocProvider';

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
const OpenIDFlowCallback = React.lazy(() => import('./pages/OpenIDFlowCallback/OpenIDFlowCallback'));

const Layout = lazyWithDelay(() => import('./components/Layout/Layout'), 400);
const Login = lazyWithDelay(() => import('./pages/Login/Login'), 400);
const LoginState = lazyWithDelay(() => import('./pages/Login/LoginState'), 400);
const NotFound = lazyWithDelay(() => import('./pages/NotFound/NotFound'), 400);
const OIDCCallback = lazyWithDelay(() => import('./pages/OIDCCallback/OIDCCallback'), 400);

const ProtectedRouteWrapper = ({ layout = true }) => {
	const location = useLocation();

	const content = (
		<Suspense fallback={<Spinner size='small' />}>
			<FadeInContentTransition appear reanimateKey={location.pathname}>
				<NotificationOfflineWarning />
				<Outlet />
			</FadeInContentTransition>
		</Suspense>
	);

	return (
		<PrivateRoute>
			{layout ? <Layout>{content}</Layout> : content}
		</PrivateRoute>
	);
};

const PublicRouteWrapper = () => {
	const location = useLocation();
	return (
		<FadeInContentTransition reanimateKey={location.pathname}>
			<Outlet />
		</FadeInContentTransition>
	);
}

function App() {
	const multiTenant = useMemo(() => isMultiTenant(), []);
	const routeWrapper = useMemo(
		() => {
			const wrapper = <HocProvider><Outlet /></HocProvider>;

			return multiTenant
				? <TenantProvider>{wrapper}</TenantProvider>
				: wrapper;
		},
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
						{/**
						 * Protected routes without layout, used for flows that require a blank page (e.g. OIDC callback)
						 */}
						<Route element={<ProtectedRouteWrapper layout={false} />}>
							<Route path="cb/*" element={<OpenIDFlowCallback />} />
						</Route>
						{/**
						 * Protected routes with layout, used for the main app pages.
						 */}
						<Route element={<ProtectedRouteWrapper />}>
							<Route index element={<Home />} />
							<Route path="settings" element={<Settings />} />
							<Route path="credential/:batchId" element={<Credential />} />
							<Route path="credential/:batchId/history" element={<CredentialHistory />} />
							<Route path="credential/:batchId/details" element={<CredentialDetails />} />
							<Route path="history" element={<History />} />
							<Route path="pending" element={<Pending />} />
							<Route path="history/:transactionId" element={<HistoryDetail />} />
							<Route path="add" element={<AddCredentials />} />
							<Route path="send" element={<SendCredentials />} />
							<Route path="verification/result" element={<VerificationResult />} />
						</Route>
						{/**
						 * Public routes, used for login and OIDC gate callback.
						 */}
						<Route element={<PublicRouteWrapper/>}>
							<Route path="login" element={<Login />} />
							<Route path="login-state" element={<LoginState />} />
							<Route path="oidc/cb" element={<OIDCCallback />} />
							<Route path="*" element={<NotFound />} />
						</Route>
					</Route>
				</Routes>
			</Suspense>
		</>
	);
}

export default App;
