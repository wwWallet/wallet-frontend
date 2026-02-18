// MessagePopup.js
import React, { useContext, useState, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';
import SessionContext from '@/context/SessionContext';
import { useTenant } from '@/context/TenantContext';
import { buildTenantRoutePath } from '@/lib/tenant';
import { useLocation, useNavigate } from 'react-router-dom';
import checkForUpdates from '@/offlineUpdateSW';
import { UserLock } from 'lucide-react';

const WebauthnLogin = ({
	filteredUser,
	onClose,
}) => {
	const { api, keystore } = useContext(SessionContext);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { effectiveTenantId } = useTenant();

	const [isSubmitting, setIsSubmitting] = useState(false);

	const onLogin = useCallback(
		async (cachedUser) => {
			// Pass the tenantId from URL path to ensure proper tenant-scoped login
			const result = await api.loginWebauthn(keystore, async () => false, [], cachedUser, effectiveTenantId);
			if (result.ok) {
				const params = new URLSearchParams(window.location.search);
				params.delete("user");
				params.delete('sync')
				navigate(`${window.location.pathname}?${params.toString()}`, { replace: true });
			} else {
				const err = result.val;

				// Handle tenant discovery error - redirect to tenant-specific login
				if (typeof err === 'object' && err.errorId === 'tenantDiscovered') {
					console.log('Tenant discovered during sync login:', err.tenantId, '- redirecting with auto-retry...');
					navigate(`${buildTenantRoutePath(err.tenantId, 'login')}?autoRetry=true`, { replace: true });
					return;
				}

				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (err) {
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
		[api, keystore, navigate, t, effectiveTenantId],
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
						<UserLock className="inline text-xl mr-2" />
						{isSubmitting
							? t('loginSignup.submitting')
							: t('common.continue')}
					</Button>
				</div>
			</ul>
			{error && <div className="text-lm-red dark:text-dm-red pt-2">{error}</div>}
		</>
	);
};

const SyncPopup = ({ message, onClose }) => {
	const { description } = message || {};
	const { t } = useTranslation();

	const { keystore } = useContext(SessionContext);
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
				const decodedState = atob(state);
				const stateObj = JSON.parse(decodedState);
				return [cachedUsers.find(user => user.userHandleB64u === stateObj.userHandleB64u), false, authenticated === 'true'];
			} catch (error) {
				console.error('Error decoding state:', error);
			}
		}

		return [null, false, authenticated === 'true'];
	};
	const [filteredUser] = getfilteredUser();

	if (!filteredUser) {
		return;
	}

	return (
		<PopupLayout isOpen={true} onClose={onClose} shouldCloseOnOverlayClick={false}>
			<div className="flex flex-col items-center text-center mb-2">
				<p className="font-bold text-xl mt-2 dark:text-dm-gray-100">
					{t('loginState.title')} {filteredUser.displayName}
				</p>
				<p className=" mb-2 mt-2 dark:text-dm-gray-100">
					<Trans
						i18nKey={description}
						components={{ strong: <strong /> }}
					/>
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
