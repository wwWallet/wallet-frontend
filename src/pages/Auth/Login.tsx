import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import Button from '../../components/Buttons/Button';

import checkForUpdates from '../../offlineUpdateSW';
import Spinner from '../../components/Shared/Spinner';
import AuthCard from '../../components/Auth/AuthCard';
import WebauthnSignupLogin from '../../components/Auth/WebauthnSignupLogin';

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

	const useOtherAccount = () => {
		setIsLoginCache(false);
		setWebauthnError('');
		checkForUpdates();
		updateOnlineStatus();
	}

	return (
		<AuthCard
			heading={isLoginCache ? t('loginSignup.loginCache') : t('loginSignup.signIn')}
			showPasskeyInfoPopup={!isLoginCache}
		>
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
					<a
						id="signUp-switch-loginsignup"
						href="/register"
						title={!isOnline && t('common.offlineTitle')}
						className='underline'
					>
						{t('loginSignup.signUp')}
					</a>
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
		</AuthCard>
	);
};

export default Login;
