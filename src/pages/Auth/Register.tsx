import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import Button from '../../components/Buttons/Button';

import checkForUpdates from '../../offlineUpdateSW';
import Spinner from '../../components/Shared/Spinner';
import AuthLayout from './AuthLayout';
import WebauthnSignupLogin from './WebauthnSignupLogin';

const Register = () => {
	const { updateOnlineStatus } = useContext(StatusContext);
	const { isLoggedIn } = useContext(SessionContext);
	const { t } = useTranslation();

	const [webauthnError, setWebauthnError] = useState<React.ReactNode>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAwaitingRedirect, setIsAwaitingRedirect] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (isLoggedIn) {
			navigate(`/${window.location.search}`, { replace: true });
		}
	}, [isLoggedIn, navigate]);

	if (isAwaitingRedirect || isLoggedIn) {
		return <Spinner />;
	}

	const goToSignIn = () => {
		setWebauthnError('');
		checkForUpdates();
		updateOnlineStatus();
		navigate('/login', { state: { skipCachedAccounts: true } });
	}

	return (
		<AuthLayout heading={t('loginSignup.signUp')}>
			<WebauthnSignupLogin
				isLogin={false}
				isSubmitting={isSubmitting}
				setIsSubmitting={setIsSubmitting}
				isLoginCache={false}
				error={webauthnError}
				setError={setWebauthnError}
				setIsAwaitingRedirect={setIsAwaitingRedirect}
			/>
			<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100">
				{t('loginSignup.alreadyHaveAccountQuestion')}
				<Button
					id="signIn-switch-loginsignup"
					variant="link"
					onClick={goToSignIn}
				>
					{t('loginSignup.signIn')}
				</Button>
			</p>
		</AuthLayout>
	);
};

export default Register;
