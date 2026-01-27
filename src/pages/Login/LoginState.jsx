import React, { useCallback, useContext, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import Button from '../../components/Buttons/Button';
import LoginPageLayout from '../../components/Auth/LoginLayout';
import checkForUpdates from '../../offlineUpdateSW';
import ConnectionStatusIcon from '../../components/Layout/Navigation/ConnectionStatusIcon';
import { Info, UserLock } from 'lucide-react';

const WebauthnLogin = ({ filteredUser }) => {
	const { api, keystore } = useContext(SessionContext);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onLogin = useCallback(
		async (cachedUser) => {
			const result = await api.loginWebauthn(keystore, async () => false, [], cachedUser);
			if (result.ok) {
				const queryParams = new URLSearchParams(location.search);
				const targetPath = queryParams.has('qrcodeurl') ? '/pre-auth' : '/';
				navigate(`${targetPath}${location.search}`, { replace: true });
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
		[api, keystore, navigate, t, location],
	);

	return (
		<div className='flex flex-row gap-4 justify-center'>
			<Button onClick={() => navigate('/')} disabled={isSubmitting}>
				{t('common.cancel')}
			</Button>
			<Button
				onClick={() => { setIsSubmitting(true); onLogin(filteredUser).finally(() => setIsSubmitting(false)); }}
				variant="primary"
				disabled={isSubmitting}
			>
				<UserLock className="inline mr-2" />
				{isSubmitting ? t('loginSignup.submitting') : t('common.continue')}
			</Button>
		</div>
	);
};

const LoginState = () => {
	const { isOnline } = useContext(StatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const hasQr = queryParams.has('qrcodeurl');
	if (isLoggedIn) {
		const destPath = hasQr ? '/pre-auth' : '/';
		return <Navigate to={`${destPath}${location.search}`} replace />;
	}
	const cachedUsers = keystore.getCachedUsers();
	const user = queryParams.get('user');
	const state = queryParams.get('state');
	let filteredUser = null;
	if (user) {
		filteredUser = cachedUsers.find((u) => u.userHandleB64u === user);
	} else if (state) {
		try {
			const stateObj = JSON.parse(atob(state));
			filteredUser = cachedUsers.find(u => u.userHandleB64u === stateObj.userHandleB64u);
		} catch (e) { console.error(e); }
	}
	if (!filteredUser) return <Navigate to="/login" replace />;
	return (
		<LoginPageLayout heading={<Trans i18nKey="loginState.welcomeBackMessage" components={{ highlight: <span className="text-primary" /> }} />}>
			<div className="relative p-8 bg-white dark:bg-dm-gray-800 rounded-lg shadow text-center space-y-6">
				<h1 className="text-xl font-bold dark:text-white">
					{t('loginState.title')} {filteredUser.displayName}
				</h1>
				<div className='absolute top-2 left-5'><ConnectionStatusIcon backgroundColor='light' /></div>
				<div className='absolute top-2 right-3'><LanguageSelector /></div>
				{isOnline === false && (
					<p className="text-sm italic text-red-500"><Info size={14} className="inline mr-2" />{t('loginSignup.messageOffline')}</p>
				)}
				<p className="text-sm text-gray-600 dark:text-gray-300">
					<Trans i18nKey="loginState.message" components={{ strong: <strong /> }} />
				</p>
				<WebauthnLogin filteredUser={filteredUser} />
			</div>
		</LoginPageLayout>
	);
};

export default LoginState;
