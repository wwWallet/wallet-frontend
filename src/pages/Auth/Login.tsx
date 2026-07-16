import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import Link from '../../components/Links/Link';

import Spinner from '../../components/Shared/Spinner';
import AuthCard from '../../components/Auth/AuthCard';
import WebauthnSignupLogin from '../../components/Auth/WebauthnSignupLogin';

const Login = () => {
	const { isOnline } = useContext(StatusContext);
	const { isLoggedIn } = useContext(SessionContext);
	const { t } = useTranslation();

	const [webauthnError, setWebauthnError] = useState<React.ReactNode>('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isAwaitingRedirect, setIsAwaitingRedirect] = useState(false);
	const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (isLoggedIn) {
			navigate(`/${window.location.search}`, { replace: true });
		}
	}, [isLoggedIn, navigate]);

	if (isAwaitingRedirect || isLoggedIn) {
		return <Spinner />;
	}

	return (
		<AuthCard
			heading={isAccountSwitcherOpen ? null : t('loginSignup.signIn')}
			showPasskeyInfoPopup={!isAccountSwitcherOpen}
		>
			<WebauthnSignupLogin
				isLogin={true}
				isSubmitting={isSubmitting}
				setIsSubmitting={setIsSubmitting}
				error={webauthnError}
				setError={setWebauthnError}
				setIsAwaitingRedirect={setIsAwaitingRedirect}
				isAccountSwitcherOpen={isAccountSwitcherOpen}
				setIsAccountSwitcherOpen={setIsAccountSwitcherOpen}
			/>
			{!isAccountSwitcherOpen && (
				<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100">
					{t('loginSignup.newHereQuestion')}
					<Link
						id="signUp-switch-loginsignup"
						href="/register"
						disabled={!isOnline}
						title={!isOnline ? t('common.offlineTitle') : undefined}
					>
						{t('loginSignup.signUp')}
					</Link>
				</p>
			)}
		</AuthCard>
	);
};

export default Login;
