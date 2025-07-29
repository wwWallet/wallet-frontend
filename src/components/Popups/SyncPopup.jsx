// MessagePopup.js
import React, { useContext, useState, useCallback } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';
import SessionContext from '@/context/SessionContext';
import StatusContext from '@/context/StatusContext';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import checkForUpdates from '@/offlineUpdateSW';
import { GoPasskeyFill } from 'react-icons/go';
import { MdOutlineSyncLock } from "react-icons/md";

const WebauthnLogin = ({
	filteredUser,
	onClose,
}) => {
	const { api, keystore } = useContext(SessionContext);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const location = useLocation();
	const from = '/';
	const { t } = useTranslation();

	const [isSubmitting, setIsSubmitting] = useState(false);

	const onLogin = useCallback(
		async (cachedUser) => {
			const result = await api.loginWebauthn(keystore, async () => false, [], cachedUser);
			if (result.ok) {
				navigate(`${window.location.pathname}`, { replace: true });
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
						onClick={onClose}
						variant="cancel"
						disabled={isSubmitting}
						additionalClassName='w-full'
					>
						Logout
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

const SyncPopup = ({ message, onClose }) => {
	const { title, description } = message || {};
	const { t } = useTranslation();

	const { isOnline } = useContext(StatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const location = useLocation();

	const cachedUsers = keystore.getCachedUsers();
	const from = location.search || '/';


	const IconComponent = FaCheckCircle;
	const color = 'green-500';


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
		return;
	}

	return (
		<PopupLayout isOpen={true} onClose={onClose} shouldCloseOnOverlayClick={false}>
			<div className="flex flex-col items-center mb-2">
				<p className="font-bold text-xl mt-2 dark:text-white">
					{t('loginState.title')} {filteredUser.displayName}
				</p>
				<p className=" mb-2 mt-2 dark:text-white">
					{description}
				</p>
			</div>
			<WebauthnLogin
				filteredUser={filteredUser}
				onClose={onClose}
			/>
		</PopupLayout>
	);
};

export default SyncPopup;
