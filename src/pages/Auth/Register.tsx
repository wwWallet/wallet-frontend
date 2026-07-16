import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import Link from '../../components/Links/Link';

import checkForUpdates from '../../offlineUpdateSW';
import Spinner from '../../components/Shared/Spinner';
import AuthCard from '../../components/Auth/AuthCard';
import WebauthnSignupLogin from '../../components/Auth/WebauthnSignupLogin';

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
		navigate('/login');
	}

	return (
		<AuthCard heading={t('loginSignup.signUp')}>
			<WebauthnSignupLogin
				isLogin={false}
				isSubmitting={isSubmitting}
				setIsSubmitting={setIsSubmitting}
				error={webauthnError}
				setError={setWebauthnError}
				setIsAwaitingRedirect={setIsAwaitingRedirect}
			/>
			<p className="text-sm text-center font-light text-lm-gray-900 dark:text-dm-gray-100">
				{t('loginSignup.alreadyHaveAccountQuestion')}
				<Link
					id="signIn-switch-loginsignup"
					onClick={goToSignIn}
				>
					{t('loginSignup.signIn')}
				</Link>
			</p>
		</AuthCard>
	);
};

export default Register;
