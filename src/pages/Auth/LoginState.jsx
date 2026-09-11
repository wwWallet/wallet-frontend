import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import SessionContext from '@/context/SessionContext';

import Button from '../../components/Buttons/Button';
import AuthCard from '../../components/Auth/AuthCard';
import checkForUpdates from '../../offlineUpdateSW';
import { resolveLoginRedirect } from '../../components/Auth/loginRedirect';
import { UserLock } from 'lucide-react';

const WebauthnLogin = ({
	filteredUser,
}) => {
	const { api, keystore } = useContext(SessionContext);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.search || '/';
	const { t } = useTranslation();

	const [isSubmitting, setIsSubmitting] = useState(false);

	const onLogin = useCallback(
		async (cachedUser) => {
			const result = await api.loginWebauthn(keystore, async () => false, [], cachedUser);
			if (result.ok) {
				const params = new URLSearchParams(from);
				params.append('authenticated', 'true');
				navigate(`?${params.toString()}`, { replace: true });

			} else {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (result.val) {
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
		[api, keystore, navigate, t, from],
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
						onClick={() => navigate('/')}
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
			{error && <div role="alert" className="text-lm-red dark:text-dm-red pt-2">{error}</div>}
		</>
	);
};

const LoginState = () => {
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();
	const location = useLocation();

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
		return <Navigate to="/login" replace />;
	} else if ((isLoggedIn && !forceAuthenticate) || (forceAuthenticate === true && authenticated)) {
		return <Navigate to={resolveLoginRedirect(window.location.search)} replace />;
	}

	return (
		<AuthCard
			appHeading={
				<Trans
					i18nKey="loginState.welcomeBackMessage"
					components={{
						highlight: <span className="text-primary dark:text-brand-light" />
					}}
				/>
			}
			heading={<>{t('loginState.title')} {filteredUser.displayName}</>}
			showPasskeyInfoPopup={false}
		>
			<p className="text-sm text-center text-lm-gray-800 dark:text-white mb-2">
				<Trans
					i18nKey="loginState.message"
					components={{ strong: <strong /> }}
				/>
			</p>

			<WebauthnLogin
				filteredUser={filteredUser}
			/>
		</AuthCard>
	);
};

export default LoginState;
