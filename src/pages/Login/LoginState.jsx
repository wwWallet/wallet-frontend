import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import { GoPasskeyFill } from 'react-icons/go';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import Button from '../../components/Buttons/Button';
import LoginPageLayout from '../../components/Auth/LoginLayout';
import checkForUpdates from '../../offlineUpdateSW';
import ConnectionStatusIcon from '../../components/Layout/Navigation/ConnectionStatusIcon';

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
			const result = await api.loginWebauthn(keystore, async () => false, cachedUser);
			if (result.ok) {

				navigate(from, { replace: true });

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
						variant="cancel"
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
						<GoPasskeyFill className="inline text-xl mr-2" />
						{isSubmitting
							? t('loginSignup.submitting')
							: t('common.continue')}
					</Button>
				</div>
			</ul>
			{error && <div className="text-red-500 pt-2">{error}</div>}
		</>
	);
};

const LoginState = () => {
	const { isOnline } = useContext(StatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();
	const location = useLocation();

	const cachedUsers = keystore.getCachedUsers();
	const from = location.search || '/';

	const getfilteredUser = () => {
		const queryParams = new URLSearchParams(from);
		const state = queryParams.get('state');
		if (state) {
			try {
				console.log('state', state);
				const decodedState = atob(state);
				const stateObj = JSON.parse(decodedState);
				return cachedUsers.find(user => user.userHandleB64u === stateObj.userHandleB64u);
			} catch (error) {
				console.error('Error decoding state:', error);
			}
		}
		return null;
	};
	const filteredUser = getfilteredUser();

	if (!filteredUser) {
		return <Navigate to="/login" replace />;
	} else if (isLoggedIn) {
		return <Navigate to={`/${window.location.search}`} replace />;
	}

	return (
		<LoginPageLayout heading={
			<Trans
				i18nKey="loginState.welcomeBackMessage"
				components={{
					highlight: <span className="text-primary dark:text-primary-light" />
				}}
			/>
		}>
			<div className="relative p-8 space-y-4 md:space-y-6 bg-white rounded-lg shadow dark:bg-gray-800">
				<h1 className="pt-4 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
					{t('loginState.title')} {filteredUser.displayName}
				</h1>
				<div className='absolute text-gray-500 dark:text-white dark top-0 left-5'>
					<ConnectionStatusIcon backgroundColor='light' />
				</div>
				<div className='absolute top-0 right-3'>
					<LanguageSelector className='min-w-12 text-sm text-primary dark:text-white cursor-pointer bg-white dark:bg-gray-800 appearance-none' />
				</div>
				{isOnline === false && (
					<p className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
						<FaInfoCircle size={14} className="text-md inline-block text-gray-500 mr-2" />
						{t('loginSignup.messageOffline')}
					</p>
				)}
				<p className="text-sm text-center text-gray-600 dark:text-gray-200 mb-2">
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
