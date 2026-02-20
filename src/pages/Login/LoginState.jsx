import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import { useTenant } from '@/context/TenantContext';
import { buildTenantRoutePath } from '@/lib/tenant';

import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import Button from '../../components/Buttons/Button';
import LoginPageLayout from '../../components/Auth/LoginLayout';
import checkForUpdates from '../../offlineUpdateSW';
import ConnectionStatusIcon from '../../components/Layout/Navigation/ConnectionStatusIcon';
import { Info, UserLock } from 'lucide-react';

const WebauthnLogin = ({
	filteredUser,
}) => {
	const { api, keystore } = useContext(SessionContext);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.search || '/';
	const { t } = useTranslation();
	const { buildPath, effectiveTenantId } = useTenant();

	const [isSubmitting, setIsSubmitting] = useState(false);

	const onLogin = useCallback(
		async (cachedUser) => {
			// Pass the tenantId from URL path to ensure proper tenant-scoped login
			const result = await api.loginWebauthn(keystore, async () => false, [], cachedUser, effectiveTenantId);
			if (result.ok) {
				const params = new URLSearchParams(from);
				params.append('authenticated', 'true');
				navigate(`?${params.toString()}`, { replace: true });

			} else {
				const err = result.val;

				// Handle tenant discovery error - redirect to tenant-specific login
				if (typeof err === 'object' && err.errorId === 'tenantDiscovered') {
					console.log('Tenant discovered during login state:', err.tenantId, '- redirecting with auto-retry...');
					navigate(`${buildTenantRoutePath(err.tenantId, 'login')}?autoRetry=true`, { replace: true });
					return;
				}

				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (err) {
					case 'loginKeystoreFailed':
						setError(t('loginSignup.loginKeystoreFailed'));
						break;

					case 'passkeyInvalid':
						setError(t('loginSignup.passkeyInvalid'));
						break;

					case 'passkeyLoginFailedTryAgain':
						setError(t('loginSignup.passkeyLoginFailedTryAgain'));
						break;

					case 'passkeyLoginFailedServerError':
						setError(t('loginSignup.passkeyLoginFailedServerError'));
						break;

					default:
						throw result;
				}
			}
		},
		[api, keystore, navigate, t, from, effectiveTenantId],
	);

	const onLoginCachedUser = async (cachedUser) => {
		setError();
		setIsSubmitting(true);
		await onLogin(cachedUser);
		setIsSubmitting(false);
		checkForUpdates();
	};

	return (
		<>
			<ul className=" p-2">
				<div className='flex flex-row gap-4 justify-center mr-2'>
					<Button
						id="cancel-login-state"
						onClick={() => navigate(buildPath())}
						disabled={isSubmitting}
						additionalClassName='w-full'
					>
						{t('common.cancel')}
					</Button>
					<Button
						id={`${isSubmitting ? 'submitting' : 'continue'}-login-state`}
						onClick={() => onLoginCachedUser(filteredUser)}
						variant="primary"
						disabled={isSubmitting}
						additionalClassName='w-full'
					>
						<UserLock className="inline text-xl mr-2" />
						{isSubmitting
							? t('loginSignup.submitting')
							: t('common.continue')}
					</Button>
				</div>
			</ul>
			{error && <div className="text-lm-red dark:text-dm-red pt-2">{error}</div>}
		</>
	);
};

const LoginState = () => {
	const { isOnline } = useContext(StatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();
	const location = useLocation();
	const { buildPath } = useTenant();

	const cachedUsers = keystore.getCachedUsers();
	const from = location.search || '/';

	const getfilteredUser = () => {
		const queryParams = new URLSearchParams(from);
		const state = queryParams.get('state');
		const user = queryParams.get('user');
		const authenticated = queryParams.get('authenticated');
		if (user) {
			return [cachedUsers.find((u) => u.userHandleB64u === user), true, authenticated === 'true'];
		}
		if (state) {
			try {
				console.log('state', state);
				const decodedState = atob(state);
				const stateObj = JSON.parse(decodedState);
				return [cachedUsers.find(user => user.userHandleB64u === stateObj.userHandleB64u), false, authenticated === 'true'];
			} catch (error) {
				console.error('Error decoding state:', error);
			}
		}

		return [null, false, authenticated === 'true'];
	};
	const [filteredUser, forceAuthenticate, authenticated] = getfilteredUser();

	if (!filteredUser) {
		return <Navigate to={buildPath('login')} replace />;
	} else if ((isLoggedIn && !forceAuthenticate) || (forceAuthenticate === true && authenticated)) {
		return <Navigate to={`${buildPath()}${window.location.search}`} replace />;
	}

	return (
		<LoginPageLayout heading={
			<Trans
				i18nKey="loginState.welcomeBackMessage"
				components={{
					highlight: <span className="text-primary dark:text-brand-light" />
				}}
			/>
		}>
			<div className="relative p-8 space-y-4 md:space-y-6 bg-white rounded-lg shadow dark:bg-dm-gray-800">
				<h1 className="pt-4 text-xl font-bold leading-tight tracking-tight text-dm-gray-900 md:text-2xl text-center dark:text-white">
					{t('loginState.title')} {filteredUser.displayName}
				</h1>
				<div className='absolute text-lm-gray-800 dark:text-dm-gray-200  top-0 left-5'>
					<ConnectionStatusIcon backgroundColor='light' />
				</div>
				<div className='absolute top-0 right-3'>
					<LanguageSelector className='min-w-12 text-sm text-primary dark:text-white cursor-pointer bg-white dark:bg-dm-gray-800 appearance-none' />
				</div>
				{isOnline === false && (
					<p className="text-sm font-light text-lm-gray-800 dark:text-dm-gray-200 italic mb-2">
						<Info size={14} className="text-md inline-block text-lm-gray-800 dark:text-dm-gray-200 mr-2" />
						{t('loginSignup.messageOffline')}
					</p>
				)}
				<p className="text-sm text-center text-lm-gray-800 dark:text-dm-gray-20 mb-2">
					<Trans
						i18nKey="loginState.message"
						components={{ strong: <strong /> }}
					/>
				</p>

				<WebauthnLogin
					filteredUser={filteredUser}
				/>

			</div>
		</LoginPageLayout>
	);
};

export default LoginState;
