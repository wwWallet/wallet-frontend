import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import { GoPasskeyFill } from 'react-icons/go';
import { Trans, useTranslation } from 'react-i18next';

import OnlineStatusContext from '../../context/OnlineStatusContext';
import SessionContext from '../../context/SessionContext';

import GetButton from '../../components/Buttons/GetButton';
import { PiWifiHighBold, PiWifiSlashBold } from "react-icons/pi";
import LoginPageLayout from './LoginPageLayout';


const WebauthnLogin = ({
	filteredUser,
}) => {
	const { api, keystore } = useContext(SessionContext);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.state?.from || '/';
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
	};

	return (
		<>
			<ul className=" p-2">
				<div className='flex flex-row gap-4 justify-center mr-2'>
					<GetButton
						content={
							<>
								{t('common.cancel')}
							</>
						}
						onClick={() => navigate('/')}
						variant="cancel"
						disabled={isSubmitting}
						additionalClassName='w-full'
					/>
					<GetButton
						content={
							<>
								<GoPasskeyFill className="inline text-xl mr-2" />
								{isSubmitting ? t('loginSignup.submitting') : t('common.continue')}
							</>
						}
						onClick={() => onLoginCachedUser(filteredUser)}
						variant="primary"
						disabled={isSubmitting}
						additionalClassName='w-full'
					/>
				</div>
			</ul>
			{error && <div className="text-red-500 pt-4">{error}</div>}
		</>
	);
};

const LoginState = () => {
	const { isOnline } = useContext(OnlineStatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();
	const location = useLocation();

	const cachedUsers = keystore.getCachedUsers();
	const from = location.state?.from;

	const getCachedUser = () => {
		const queryParams = new URLSearchParams(from?.search ?? location.search);
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
	const filteredUser = getCachedUser();

	if (!filteredUser) {
		return <Navigate to="/login" replace />;
	} else if (isLoggedIn) {
		return <Navigate to="/" replace />;
	}

	return (
		<LoginPageLayout heading={
			<Trans
				i18nKey="loginState.welcomeBackMessage"
				values={{ walletName: t("common.walletName") }}
				components={{
					highlight: <span className="text-primary dark:text-primary-light" />
				}}
			/>
		}>
			<div className="relative p-6 space-y-4 md:space-y-6 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
				<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
					{t('loginState.title')} {filteredUser.displayName}
				</h1>
				<div className='absolute text-gray-500 dark:text-white dark top-0 left-5'>
					{isOnline ? (
						<PiWifiHighBold size={25} title={t('common.online')} />
					) : (
						<PiWifiSlashBold size={25} title={t('common.offline')} />
					)}
				</div>
				{isOnline === false && (
					<p className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
						<FaInfoCircle size={14} className="text-md inline-block text-gray-500 mr-2" />
						{t('loginSignup.messageOffline')}
					</p>
				)}
				<p className="text-sm text-gray-600 dark:text-gray-200 mb-2">
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
