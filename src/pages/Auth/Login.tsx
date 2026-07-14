import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import Button from '../../components/Buttons/Button';

import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import LoginLayout from '../../components/Auth/LoginLayout';
import checkForUpdates from '../../offlineUpdateSW';
import Spinner from '../../components/Shared/Spinner';
import WebauthnSignupLogin from './WebauthnSignupLogin';

import { Info } from 'lucide-react';
import PasskeyInfoPopup from '@/components/Popups/PasskeyInfoPopup';

const Login = () => {
	const { isOnline, updateOnlineStatus } = useContext(StatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();

	const [webauthnError, setWebauthnError] = useState<React.ReactNode>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAwaitingRedirect, setIsAwaitingRedirect] = useState(false);

	const navigate = useNavigate();
	const location = useLocation();
	const [skipCachedAccounts] = useState(
		() => Boolean((location.state as { skipCachedAccounts?: boolean } | null)?.skipCachedAccounts)
	);

	const { getCachedUsers } = keystore;
	const [isLoginCache, setIsLoginCache] = useState(!skipCachedAccounts && getCachedUsers().length > 0);

	useEffect(() => {
		setIsLoginCache(!skipCachedAccounts && getCachedUsers().length > 0);
	}, [getCachedUsers, setIsLoginCache, skipCachedAccounts]);

	useEffect(() => {
		if (skipCachedAccounts) {
			navigate(location.pathname, { replace: true });
		}
	}, [skipCachedAccounts, navigate, location.pathname]);

	useEffect(() => {
		if (isLoggedIn) {
			navigate(`/${window.location.search}`, { replace: true });
		}
	}, [isLoggedIn, navigate]);

	if (isAwaitingRedirect || isLoggedIn) {
		return <Spinner />;
	}

	const goToRegister = () => {
		if (isOnline) {
			navigate('/register');
		}
	}

	const useOtherAccount = () => {
		setIsLoginCache(false);
		setWebauthnError('');
		checkForUpdates();
		updateOnlineStatus();
	}

	return (
		<LoginLayout heading={
			<span className="text-primary dark:text-brand-light"> {t('common.walletName')}</span>
		}>
			<div className="relative p-8 sm:px-12 space-y-4 md:space-y-6 lg:space-y-8 bg-white rounded-lg dark:bg-dm-gray-900 border border-lm-gray-400 dark:border-dm-gray-600">
				<h1 className="pt-4 text-xl font-bold leading-tight tracking-tight text-dm-gray-900 md:text-2xl text-center dark:text-white">
					{isLoginCache ? t('loginSignup.loginCache') : t('loginSignup.signIn')}
				</h1>

				<div className='absolute top-5 right-5'>
					<LanguageSelector className='min-w-12 text-sm text-lm-gray-900 dark:text-white cursor-pointer bg-white dark:bg-dm-gray-900 appearance-none' />
				</div>

				{isOnline === false && (
					<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 italic mb-2">
						<Info size={14} className="text-md inline-block mr-1" />
						{t('loginSignup.messageOffline')}
					</p>
				)}

				<WebauthnSignupLogin
					isLogin={true}
					isSubmitting={isSubmitting}
					setIsSubmitting={setIsSubmitting}
					isLoginCache={isLoginCache}
					error={webauthnError}
					setError={setWebauthnError}
					setIsAwaitingRedirect={setIsAwaitingRedirect}
				/>
				{!isLoginCache ? (
					<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100">
						{t('loginSignup.newHereQuestion')}
						<Button
							id="signUp-switch-loginsignup"
							variant="link"
							onClick={goToRegister}
							disabled={!isOnline}
							title={!isOnline && t('common.offlineTitle')}
						>
							{t('loginSignup.signUp')}
						</Button>
					</p>
				) : (
					<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 cursor-pointer">
						<Button
							id="useOtherAccount-switch-loginsignup"
							variant="link"
							onClick={useOtherAccount}
						>
							{t('loginSignup.useOtherAccount')}
						</Button>
					</p>
				)}
			</div>
			{!isLoginCache && <PasskeyInfoPopup />}
		</LoginLayout>
	);
};

export default Login;
