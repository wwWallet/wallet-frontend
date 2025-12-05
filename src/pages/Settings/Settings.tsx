import React, { FormEvent, KeyboardEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import AppSettingsContext, { ColorScheme } from '@/context/AppSettingsContext';

import useScreenType from '../../hooks/useScreenType';

import { UserData, WebauthnCredential } from '../../api/types';
import { compareBy, toBase64Url } from '../../util';
import { withAuthenticatorAttachmentFromHints } from '@/util-webauthn';
import { formatDate } from '@/utils';
import type { WebauthnPrfEncryptionKeyInfo } from '../../services/keystore';
import { isPrfKeyV2, serializePrivateData } from '../../services/keystore';

import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
import { H1, H2, H3 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { Bell, ChevronDown, Edit, FingerprintIcon, Laptop, Lock, LockOpen, Moon, RefreshCcw, Smartphone, SmartphoneNfcIcon, Sun, Trash2 } from 'lucide-react';
import { UsbStickDotIcon } from '@/components/Shared/CustomIcons';

function useWebauthnCredentialNickname(credential: WebauthnCredential): string {
	const { t } = useTranslation();
	if (credential) {
		return credential.nickname || `${t('pageSettings.passkeyItem.unnamed')} ${credential.id.substring(0, 8)}`;
	} else {
		return "";
	}
}

type UpgradePrfState = (
	null
	| {
		state: "authenticate",
		prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
		webauthnCredential: WebauthnCredential,
		abortController: AbortController,
	}
	| {
		state: "err",
		err: any,
		prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
		webauthnCredential: WebauthnCredential,
	}
);

const Dialog = ({
	children,
	open,
	onCancel,
}: {
	children: ReactNode,
	open: boolean,
	onCancel: () => void,
}) => {
	const dialog = useRef<HTMLDialogElement>();

	useEffect(
		() => {
			if (dialog.current) {
				if (open) {
					dialog.current.showModal();
				} else {
					dialog.current.close();
				}
			}
		},
		[dialog, open],
	);

	return (
		<dialog
			ref={dialog}
			className="p-4 pt-8 text-center md:space-y-6 sm:p-8 bg-lm-gray-50 dark:bg-dm-gray-950 border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg backdrop:bg-black/80"
			style={{ minWidth: '30%' }}
			onCancel={onCancel}
		>
			{children}
		</dialog>
	);
};

const WebauthnRegistation = ({
	onSuccess,
}: {
	onSuccess: () => void,
}) => {
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);
	const [beginData, setBeginData] = useState(null);
	const [pendingCredential, setPendingCredential] = useState(null);
	const [nickname, setNickname] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<null | ((accept: boolean) => void)>(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const { t } = useTranslation();
	const screenType = useScreenType();

	const stateChooseNickname = Boolean(beginData) && !needPrfRetry;

	const onBegin = useCallback(
		async (webauthnHint) => {
			setBeginData(null);
			setIsSubmitting(true);
			setPendingCredential(null);

			const beginResp = await api.post('/user/session/webauthn/register-begin', {});
			console.log("begin", beginResp);
			const beginData = beginResp.data;

			if (beginData.challengeId) {
				setBeginData(beginData);

				const hints = [webauthnHint];
				const createOptions = {
					...beginData.createOptions,
					publicKey: {
						...beginData.createOptions.publicKey,
						hints,
						authenticatorSelection: withAuthenticatorAttachmentFromHints(beginData.createOptions.publicKey.authenticatorSelection, hints),
					},
				};

				try {
					const credential = await navigator.credentials.create(createOptions);
					console.log("created", credential);
					setPendingCredential(credential);
				} catch (e) {
					console.error("Failed to register", e);
					setBeginData(null);
					setPendingCredential(null);
				}
				setIsSubmitting(false);
			}
		},
		[api],
	);

	const onCancel = () => {
		console.log("onCancel");
		setPendingCredential(null);
		setBeginData(null);
		setNeedPrfRetry(false);
		setResolvePrfRetryPrompt(null);
		setPrfRetryAccepted(false);
		setIsSubmitting(false);
	};

	const onFinish = async (event) => {
		event.preventDefault();
		console.log("onFinish", event);

		if (beginData && pendingCredential) {
			try {
				const [newPrivateData, keystoreCommit] = await keystore.addPrf(
					pendingCredential,
					async () => {
						setNeedPrfRetry(true);
						return new Promise<boolean>((resolve, reject) => {
							setResolvePrfRetryPrompt(() => resolve);
						}).finally(() => {
							setNeedPrfRetry(false);
							setPrfRetryAccepted(true);
							setResolvePrfRetryPrompt(null);
						});
					},
				);

				setIsSubmitting(true);
				api.updatePrivateDataEtag(await api.post('/user/session/webauthn/register-finish', {
					challengeId: beginData.challengeId,
					nickname,
					credential: {
						type: pendingCredential.type,
						id: pendingCredential.id,
						rawId: pendingCredential.rawId,
						response: {
							attestationObject: pendingCredential.response.attestationObject,
							clientDataJSON: pendingCredential.response.clientDataJSON,
							transports: pendingCredential.response.getTransports(),
						},
						authenticatorAttachment: pendingCredential.authenticatorAttachment,
						clientExtensionResults: pendingCredential.getClientExtensionResults(),
					},
					privateData: serializePrivateData(newPrivateData),
				}));
				onSuccess();
				setNickname("");
				await keystoreCommit();

			} catch (e) {
				console.error("Failed to finish registration", e);
				if (e?.cause === 'x-private-data-etag') {
					// TODO: Show this error to the user
					throw new Error("Private data version conflict", { cause: e });
				}

			} finally {
				onCancel();
			}
		} else {
			console.error("Invalid state:", beginData, pendingCredential);
		}
	};

	const registrationInProgress = Boolean(beginData || pendingCredential);

	return (
		<div className="flex flex-row flex-wrap items-baseline gap-2">
			<span className="grow">{t('pageSettings.addPasskey')}</span>
			{
				[
					{ hint: "client-device", btnLabel: t('common.platformPasskey'), Icon: FingerprintIcon },
					{ hint: "security-key", btnLabel: t('common.externalPasskey'), Icon: UsbStickDotIcon },
					{ hint: "hybrid", btnLabel: t('common.hybridPasskey'), Icon: SmartphoneNfcIcon },
				].map(({ Icon, hint, btnLabel }) => (
					<Button
						key={hint}
						id={`add-passkey-settings-${hint}`}
						onClick={() => onBegin(hint)}
						variant="outline"
						disabled={registrationInProgress || !isOnline}
						ariaLabel={(
							!isOnline
								? t("common.offlineTitle")
								: (screenType !== 'desktop' ? t('pageSettings.addPasskey') : "")
						)}
						title={(
							!isOnline
								? t("common.offlineTitle")
								: (screenType !== 'desktop' ? t('pageSettings.addPasskeyTitle') : "")
						)}
					>
						<div className="flex items-center">
							<Icon size={18} />
							<span className='hidden md:block ml-2'>
								{btnLabel}
							</span>
						</div>
					</Button>
				))
			}

			<Dialog
				open={stateChooseNickname}
				onCancel={onCancel}
			>
				<form method="dialog" onSubmit={onFinish}>
					{pendingCredential
						? (
							<>
								<H2 heading={t('registerPasskey.messageSuccess')} hr={false} flexJustifyContent='center' />
								<p className="mb-2 dark:text-white">{t('registerPasskey.giveNickname')}</p>
								<input
									type="text"
									className="my-4 w-full px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride"
									aria-label={t('registerPasskey.nicknameAriaLabel')}
									autoFocus={true}
									disabled={isSubmitting}
									onChange={(event) => setNickname(event.target.value)}
									placeholder={t('registerPasskey.nicknamePlaceholder')}
									value={nickname}
								/>
							</>
						)
						: (
							<>
								<p className='dark:text-white'>{t('registerPasskey.messageInteract')}</p>
							</>
						)
					}

					<div className="pt-2 flex justify-center gap-2">
						<Button
							id="cancel-add-passkey-settings"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							{t('common.cancel')}
						</Button>

						{pendingCredential && (
							<Button
								id="save-add-passkey-settings"
								type="submit"
								variant="primary"
								disabled={isSubmitting}
							>
								{t('common.save')}
							</Button>
						)}
					</div>

				</form>
			</Dialog>

			<Dialog
				open={needPrfRetry && !prfRetryAccepted}
				onCancel={() => resolvePrfRetryPrompt(false)}
			>
				<H2 heading={t('registerPasskey.messageDone')} flexJustifyContent='center' hr={false}/>
				<p className='dark:text-white'>{t('registerPasskey.passkeyCreated')}</p>
				<p className='dark:text-white'>{t('registerPasskey.authOnceMore')}</p>

				<div className='flex justify-center gap-2'>
					<Button
						id="cancel-prf-passkey-settings"
						onClick={() => resolvePrfRetryPrompt(false)}
					>
						{t('common.cancel')}
					</Button>

					<Button
						id="continue-prf-passkey-settings"
						onClick={() => resolvePrfRetryPrompt(true)}
						variant="primary"
						disabled={prfRetryAccepted}
					>
						{t('common.continue')}
					</Button>
				</div>

			</Dialog>

			<Dialog
				open={prfRetryAccepted}
				onCancel={onCancel}
			>
				<p className='dark:text-white'>{t('registerPasskey.messageInteractNewPasskey')}</p>
				<div className='flex justify-center'>
					<Button
						id="cancel-in-progress-prf-settings"

						onClick={onCancel}
					>
						{t('common.cancel')}
					</Button>
				</div>
			</Dialog>
		</div>
	);
};

const UnlockMainKey = ({
	onLock,
	onUnlock,
	unlocked,
}: {
	onLock: () => void,
	onUnlock: () => void,
	unlocked: boolean,
}) => {
	const { isOnline } = useContext(StatusContext);
	const { keystore } = useContext(SessionContext);
	const [inProgress, setInProgress] = useState(false);
	const [resolvePasswordPromise, setResolvePasswordPromise] = useState<((password: string) => void) | null>(null);
	const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { t } = useTranslation();
	const isPromptingForPassword = Boolean(resolvePasswordPromise);
	const screenType = useScreenType();

	useEffect(
		() => {
			setError("");
		},
		[],
	);

	const onBeginUnlock = useCallback(
		async () => {
			setInProgress(true);
			try {
				await keystore.getPasswordOrPrfKeyFromSession(
					() => new Promise<string>(resolve => {
						setResolvePasswordPromise(() => resolve);
					}).finally(() => {
						setResolvePasswordPromise(null);
						setPassword("");
					}),
					async () => true,
				);
				onUnlock();
			} catch (e) {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (e?.cause?.errorId) {
					case 'passkeyInvalid':
						setError(t('passkeyInvalid'));
						break;

					case 'passkeyLoginFailedTryAgain':
						setError(t('passkeyLoginFailedTryAgain'));
						break;

					case 'passwordUnlockFailed':
						setError(t('passwordUnlockFailed'));
						onBeginUnlock();
						break;

					default:
						throw e;
				}
			} finally {
				setInProgress(false);
				setIsSubmittingPassword(false);
			}
		},
		[keystore, onUnlock, t],
	);

	const onSubmitPassword = (event) => {
		event.preventDefault();
		if (resolvePasswordPromise) {
			setIsSubmittingPassword(true);
			resolvePasswordPromise(password);
		}
	};

	const onCancelPassword = () => {
		if (resolvePasswordPromise) {
			setIsSubmittingPassword(false);
			resolvePasswordPromise(null);
		}
		onLock();
	};

	return (
		<>
			<Button
				id={`${unlocked ? 'lock-passkey' : 'unlock-passkey'}-management-settings`}
				onClick={unlocked ? onLock : onBeginUnlock}
				variant="primary"
				disabled={inProgress || (!unlocked && !isOnline)}
				ariaLabel={!unlocked && !isOnline ? t("common.offlineTitle") : screenType !== 'desktop' && (unlocked ? t('pageSettings.lockSensitive') : t('pageSettings.unlockSensitive'))}
				title={!unlocked && !isOnline ? t("common.offlineTitle") : screenType !== 'desktop' && (unlocked ? t('pageSettings.lockSensitiveTitle') : t('pageSettings.unlockSensitiveTitle'))}
			>
				<div className="flex items-center">
					{unlocked
						? <>
							<LockOpen size={18} />
							<span className='hidden md:block ml-2'>
								{t('pageSettings.lockSensitive')}
							</span>
						</>
						: <>
							<Lock size={18} />
							<span className='hidden md:block ml-2'>
								{t('pageSettings.unlockSensitive')}
							</span>
						</>
					}
				</div>
			</Button>
			<Dialog
				open={isPromptingForPassword}
				onCancel={onCancelPassword}
			>
				<form method="dialog" onSubmit={onSubmitPassword}>
					<h3 className="text-2xl mt-4 mb-2 font-bold text-custom-blue">{t('pageSettings.unlockPassword.title')}</h3>
					<p className="mb-2">{t('pageSettings.unlockPassword.description')}</p>
					<input
						type="password"
						className="my-4 w-full px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride"
						aria-label={t('pageSettings.unlockPassword.passwordInputAriaLabel')}
						autoFocus={true}
						disabled={isSubmittingPassword}
						onChange={(event) => setPassword(event.target.value)}
						placeholder={t('pageSettings.unlockPassword.passwordInputPlaceholder')}
						value={password}
					/>

					<div className='flex gap-2 justify-center align-center'>
						<Button
							id="cancel-password-management-settings"
							onClick={onCancelPassword}
							disabled={isSubmittingPassword}
						>
							{t('common.cancel')}
						</Button>
						<Button
							id="submit-password-management-settings"
							type="submit"
							variant='primary'
							disabled={isSubmittingPassword}
						>
							{t('common.submit')}
						</Button>
					</div>

					{error &&
						<p className="text-lm-red dark:text-dm-red mt-2">
							{error}
						</p>
					}
				</form>
			</Dialog>
		</>
	);
};

const WebauthnCredentialItem = ({
	credential,
	prfKeyInfo,
	onDelete,
	onRename,
	onUpgradePrfKey,
}: {
	credential: WebauthnCredential,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
	onDelete?: false | (() => Promise<void>),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
	onUpgradePrfKey: (prfKeyInfo: WebauthnPrfEncryptionKeyInfo) => void,
}) => {
	const { isOnline } = useContext(StatusContext);
	const [nickname, setNickname] = useState(credential.nickname || '');
	const [editing, setEditing] = useState(false);
	const { t } = useTranslation();
	const currentLabel = useWebauthnCredentialNickname(credential);
	const [submitting, setSubmitting] = useState(false);
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => setIsDeleteConfirmationOpen(false);

	const handleDelete = async () => {
		if (onDelete) {
			setLoading(true);
			await onDelete(); // Wait for the delete function to complete
			setLoading(false);
			closeDeleteConfirmation();
		}
	};

	const onCancelEditing = useCallback(
		() => {
			setNickname(credential.nickname || '');
			setEditing(false);
		},
		[credential.nickname],
	);

	const onKeyUp = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Escape") {
				onCancelEditing();
			}
		},
		[onCancelEditing],
	);

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		try {
			const result = await onRename(credential, nickname);
			if (result) {
				setEditing(false);
			}
		} finally {
			setSubmitting(false);
		}
	};

	const needsPrfUpgrade = prfKeyInfo && !isPrfKeyV2(prfKeyInfo);

	return (
		<form
			className="mb-2 pl-4 px-4 py-2 border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg flex flex-row flex-wrap gap-y-2 overflow-x-auto"
			onSubmit={onSubmit}
		>
			<div className="grow">
				{editing
					? (
						<>
							<div className="flex items-center gap-2">
								<p className="font-semibold dark:text-white">
									{t('pageSettings.passkeyItem.nickname')}:&nbsp;
								</p>
								<input
									className="w-36 px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride"

									type="text"
									placeholder={t('pageSettings.passkeyItem.nicknameInput')}
									value={nickname}
									onChange={(event) => setNickname(event.target.value)}
									aria-label={t('pageSettings.passkeyItem.nicknameInputAriaLabel', { passkeyLabel: currentLabel })}
									onKeyUp={onKeyUp}
									disabled={submitting}
								/>
							</div>
						</>
					)
					: (
						<div className="flex items-center">
							<p>
								<span className="font-semibold dark:text-white">
									{t('pageSettings.passkeyItem.nickname')}:&nbsp;
								</span>
								<span className="italic">
									{currentLabel}
								</span>
							</p>
						</div>
					)
				}
				<p className='dark:text-white'>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.created')}:&nbsp;
					</span>
					{formatDate(credential.createTime)}
				</p>
				<p className='dark:text-white'>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.lastUsed')}:&nbsp;
					</span>
					{formatDate(credential.lastUseTime)}</p>
				<p className='dark:text-white flex gap-3 items-center'>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.canEncrypt')}:&nbsp;
					</span>
					{credential.prfCapable ? t('pageSettings.passkeyItem.canEncryptYes') : t('pageSettings.passkeyItem.canEncryptNo')}
					{needsPrfUpgrade
						&& <span className="py-1 px-2 rounded bg-lm-orange dark:bg-dm-orange text-lm-gray-900 font-bold">{t('pageSettings.passkeyItem.needsPrfUpgrade')}</span>
					}
				</p>
			</div>

			<div className="items-start	flex gap-2">
				{needsPrfUpgrade
					&&
					<Button
						id="upgrade-prf-settings"
						variant="outline"
						type="button"
						onClick={() => onUpgradePrfKey(prfKeyInfo)}
						aria-label={t('pageSettings.passkeyItem.prfUpgradeAriaLabel', { passkeyLabel: currentLabel })}
					>
						<RefreshCcw size={18} /> {t('pageSettings.passkeyItem.prfUpgrade')}
					</Button>
				}

				{editing
					? (

						<div className='flex gap-2'>
							<Button
								id="cancel-editing-settings"
								onClick={onCancelEditing}
								disabled={submitting}
								ariaLabel={t('pageSettings.passkeyItem.cancelChangesAriaLabel', { passkeyLabel: currentLabel })}
							>
								{t('common.cancel')}
							</Button>
							<Button
								id="save-editing-settings"
								type="submit"
								disabled={submitting}
								variant="primary"
							>
								{t('common.save')}
							</Button>
						</div>
					)
					: (
						<Button
							id="rename-passkey"
							onClick={() => setEditing(true)}
							variant="primary"
							disabled={!isOnline}
							aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
							title={!isOnline ? t("common.offlineTitle") : ""}
						>
							<Edit size={18} className="mr-2" />
							{t('pageSettings.passkeyItem.rename')}
						</Button>
					)
				}

				{onDelete && (
					<Button
						id="delete-passkey"
						onClick={openDeleteConfirmation}
						variant="delete"
						disabled={!isOnline}
						aria-label={t('pageSettings.passkeyItem.deleteAriaLabel', { passkeyLabel: currentLabel })}
						title={!isOnline ? t("common.offlineTitle") : t("pageSettings.passkeyItem.deleteButtonTitleUnlocked", { passkeyLabel: currentLabel })}
						additionalClassName='ml-2 py-3'
					>
						<Trash2 size={18} />
					</Button>
				)}
				<DeletePopup
					isOpen={isDeleteConfirmationOpen}
					onConfirm={handleDelete}
					onClose={closeDeleteConfirmation}
					message={
						<Trans
							i18nKey="pageSettings.passkeyItem.messageDeletePasskey"
							values={{ nickname: nickname }}
							components={{ strong: <strong /> }}
						/>
					}
					loading={loading}
				/>
			</div>
		</form>
	);
};

const Settings = () => {
	const { isOnline, updateAvailable } = useContext(StatusContext);
	const { api, logout, keystore } = useContext(SessionContext);
	const { setColorScheme, settings } = useContext(AppSettingsContext);
	const [userData, setUserData] = useState<UserData>(null);
	const { webauthnCredentialCredentialId: loggedInPasskeyCredentialId } = api.getSession();
	const [unlocked, setUnlocked] = useState(false);
	const showDelete = userData?.webauthnCredentials?.length > 1;
	const { t } = useTranslation();
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const screenType = useScreenType();

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => setIsDeleteConfirmationOpen(false);
	const [upgradePrfState, setUpgradePrfState] = useState<UpgradePrfState | null>(null);
	const upgradePrfPasskeyLabel = useWebauthnCredentialNickname(upgradePrfState?.webauthnCredential);
	const [successMessage, setSuccessMessage] = useState('');
	const [obliviousSettingsMessage, setObliviousSettingsMessage] = useState('');

	const { getCalculatedWalletState } = keystore;

	const deleteAccount = async () => {
		try {
			await api.del('/user/session');
			const userHandleB64u = new TextEncoder().encode(userData.uuid);
			const cachedUser = keystore.getCachedUsers()
				.find((cachedUser) => cachedUser.userHandleB64u === toBase64Url(userHandleB64u));
			if (cachedUser) {
				keystore.forgetCachedUser(cachedUser);
			}
			await logout();
		}
		catch (err) {
			console.log('Error = ', err)
		}
	}

	const handleDelete = async () => {
		if (unlocked) {
			// NOTE: Unlocking is purely a client-side safeguard against accidents.
			// It is not enforced on the server side and can be easily bypassed.
			setLoading(true);
			await deleteAccount();
			closeDeleteConfirmation();
			setLoading(false);
		}
	};

	const refreshData = useCallback(
		async () => {
			keystore; // eslint-disable-line @typescript-eslint/no-unused-expressions -- Silence react-hooks/exhaustive-deps
			try {
				const response = await api.get('/user/session/account-info');
				const s = keystore.getCalculatedWalletState();
				const userData = {
					...response.data,
					settings: s.settings,
				};
				console.log(userData);
				setUserData(userData);
				dispatchEvent(new CustomEvent("settingsChanged"));
			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		},
		[
			api,
			keystore, // To react if credentials are modified in a different tab
			setUserData,
		],
	);

	useEffect(
		() => {
			refreshData();
		},
		[refreshData],
	);

	const deleteWebauthnCredential = async (credential: WebauthnCredential) => {
		const [newPrivateData, keystoreCommit] = keystore.deletePrf(credential.credentialId);
		try {
			const deleteResp = api.updatePrivateDataEtag(await api.post(`/user/session/webauthn/credential/${credential.id}/delete`, {
				privateData: serializePrivateData(newPrivateData),
			}));
			if (deleteResp.status === 204) {
				await keystoreCommit();
			} else {
				console.error("Failed to delete WebAuthn credential", deleteResp.status, deleteResp);
			}
			await refreshData();

		} catch (e) {
			console.error("Failed to delete WebAuthn credential", e);
			if (e?.cause === 'x-private-data-etag') {
				// TODO: Show this error to the user
				throw new Error("Private data version conflict", { cause: e });
			}
			throw e;
		}
	};

	const onRenameWebauthnCredential = async (credential: WebauthnCredential, nickname: string): Promise<boolean> => {
		const deleteResp = await api.post(`/user/session/webauthn/credential/${credential.id}/rename`, {
			nickname,
		});
		refreshData();
		if (deleteResp.status === 204) {
			return true;
		} else {
			console.error("Failed to rename WebAuthn credential", deleteResp.status, deleteResp);
			return false;
		}
	};

	const onUpgradePrfKey = async (prfKeyInfo: WebauthnPrfEncryptionKeyInfo) => {
		try {
			const [newPrivateData, keystoreCommit] = await keystore.upgradePrfKey(
				prfKeyInfo,
				async () => {
					const abortController = new AbortController();
					setUpgradePrfState(
						{
							state: "authenticate",
							prfKeyInfo,
							webauthnCredential: userData.webauthnCredentials.find(cred => toBase64Url(cred.credentialId) === toBase64Url(prfKeyInfo.credentialId)),
							abortController,
						}
					);
					return abortController.signal;
				},
			);
			setUpgradePrfState(null);
			try {
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
			} catch (e) {
				console.error("Failed to upgrade PRF key", e, e.status);
			}
		} catch (e) {
			console.error("Failed to upgrade PRF key", e);
			if (e?.cause === 'x-private-data-etag') {
				// TODO: Show this error to the user
				throw new Error("Private data version conflict", { cause: e });
			}

			console.error("Failed to upgrade PRF key", e);
			setUpgradePrfState(state => ({ state: "err", err: e, prfKeyInfo, webauthnCredential: state?.webauthnCredential }));
		}
	};

	const onCancelUpgradePrfKey = () => {
		if (upgradePrfState?.state === "authenticate") {
			upgradePrfState.abortController.abort();
		}
		setUpgradePrfState(null);
	};

	const loggedInPasskey = userData?.webauthnCredentials.find(
		cred => toBase64Url(cred.credentialId) === loggedInPasskeyCredentialId);

	const handleTokenMaxAgeChange = async (newMaxAge: string) => {
		try {
			if (isNaN(parseInt(newMaxAge))) {
				throw new Error("Update token max age: newMaxAge is not a number");
			}
			const [, newPrivateData, keystoreCommit] = await keystore.alterSettings({
				...getCalculatedWalletState().settings,
				openidRefreshTokenMaxAgeInSeconds: newMaxAge,
			});
			await api.updatePrivateData(newPrivateData);
			await keystoreCommit();

			console.log('Settings updated successfully');
			setSuccessMessage(t('pageSettings.rememberIssuer.successMessage'));
			setTimeout(() => {
				setSuccessMessage('');
			}, 3000);
			refreshData();
		} catch (error) {
			console.error('Failed to update settings', error);
		}
	};

	const handleObliviousChange = async (useOblivious: string) => {
		try {
			if (!['true', 'false'].includes(useOblivious)) {
				throw new Error("Update useOblivious: invalid value");
			}
			const [, newPrivateData, keystoreCommit] = await keystore.alterSettings({
				...getCalculatedWalletState().settings,
				useOblivious: useOblivious.toString(),
			});
			await api.updatePrivateData(newPrivateData);
			await keystoreCommit();

			console.log('Settings updated successfully');
			setObliviousSettingsMessage(t('pageSettings.oblivious.successMessage'));
			setTimeout(() => {
				setObliviousSettingsMessage('');
			}, 3000);
			refreshData();
		} catch (error) {
			console.error('Failed to update settings', error);
		}
	}

	return (
		<>
			<div className="px-6 sm:px-12 w-full">
				{userData && (
					<>
						<H1 heading={t('common.navItemSettings')} />
						<PageDescription description={t('pageSettings.description')} />

						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.title.language')} />
							<div className="relative inline-block min-w-36">
								<div className="relative">
									<LanguageSelector className="h-10 pl-3 pr-10 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride appearance-none" showName={true} />
								</div>
							</div>
						</div>
						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.appearance.title')} />
							<div className='pt-4'>
								<H3 heading={t('pageSettings.appearance.colorScheme.title')}>
								</H3>
								<p className='mb-2 dark:text-white'>
									{t('pageSettings.appearance.colorScheme.description')}
								</p>
							</div>
							<div className="flex gap-2">
								<div className="relative">
									<span className="absolute top-[50%] left-3 transform -translate-y-[50%] pointer-events-none">
										{settings.colorScheme === 'light' && <Sun size={18} />}
										{settings.colorScheme === 'dark' && <Moon size={18} />}
										{settings.colorScheme === 'system' && (screenType === 'desktop' ? <Laptop size={18} /> : <Smartphone size={18} />)}
									</span>
									<select
										className="h-10 pl-10 pr-10 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride appearance-none"
										value={settings.colorScheme}
										onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
									>
										<option value="system">
											{t('pageSettings.appearance.colorScheme.system')}
										</option>
										<option value="light">
											{t('pageSettings.appearance.colorScheme.light')}
										</option>
										<option value="dark">
											{t('pageSettings.appearance.colorScheme.dark')}
										</option>
									</select>
									<span className="absolute right-2 top-[50%] transform -translate-y-[50%] pointer-events-none">
										<ChevronDown size={18} />
									</span>
								</div>
							</div>
						</div>
						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.title.loggedInPasskey')} />
							{loggedInPasskey && (
								<WebauthnCredentialItem
									key={loggedInPasskey.id}
									credential={loggedInPasskey}
									prfKeyInfo={keystore.getPrfKeyInfo(loggedInPasskey.credentialId)}
									onRename={onRenameWebauthnCredential}
									onUpgradePrfKey={onUpgradePrfKey}
								/>
							)}
						</div>
						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.title.rememberIssuer')} />
							<p className='mb-2 dark:text-white'>
								{t('pageSettings.rememberIssuer.description')}
							</p>
							<div className='flex gap-2 items-center'>
								<div className="relative inline-block min-w-36">
									<div className="relative">
										<select
											className={`h-10 pl-3 pr-10 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg dark:inputDarkModeOverride appearance-none`}
											defaultValue={userData.settings.openidRefreshTokenMaxAgeInSeconds}
											onChange={(e) => handleTokenMaxAgeChange(e.target.value)}
										>
											<option value="0">{t('pageSettings.rememberIssuer.options.none')}</option>
											<option value="3600">{t('pageSettings.rememberIssuer.options.hour')}</option>
											<option value={`${24 * 3600}`}>{t('pageSettings.rememberIssuer.options.day')}</option>
											<option value={`${7 * 24 * 3600}`}>{t('pageSettings.rememberIssuer.options.week')}</option>
											<option value={`${30 * 24 * 3600}`}>{t('pageSettings.rememberIssuer.options.month')}</option>
										</select>
										<span className="absolute top-1/2 right-2 transform -translate-y-[43%] pointer-events-none">
											<ChevronDown size={18} className='dark:text-white' />
										</span>
									</div>
								</div>
								{successMessage && (
									<div className="text-md text-lm-green dark:text-dm-green">
										{successMessage}
									</div>
								)}
							</div>
						</div>
						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.oblivious.title')} />
							<p className='mb-2 dark:text-white'>
								{t('pageSettings.oblivious.description')}
							</p>
							<div className='flex gap-2 items-center'>
								<div className="relative inline-block min-w-36">
									<div className="relative">
										<select
											className={`h-10 pl-3 pr-10 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 text-lm-gray-900 dark:text-white rounded-lg dark:inputDarkModeOverride appearance-none`}
											defaultValue={userData.settings.useOblivious}
											onChange={(e) => handleObliviousChange(e.target.value)}
											disabled={!isOnline}
											title={!isOnline ? t("common.offlineTitle") : undefined}
										>
											<option value="false">{t('pageSettings.oblivious.disabled')}</option>
											<option value="true">{t('pageSettings.oblivious.gunet')}</option>
										</select>
										<span className="absolute top-1/2 right-2 transform -translate-y-[43%] pointer-events-none">
											<ChevronDown size={18} className='dark:text-white' />
										</span>
									</div>
								</div>
								{obliviousSettingsMessage && (
									<div className="text-md text-lm-green dark:text-lm-green">
										{obliviousSettingsMessage}
									</div>
								)}
							</div>
						</div>
						<div className="mt-2 mb-2 py-2">
							<H2 heading={t('pageSettings.title.manageAcount')}>
							</H2>
							<div className='mb-2'>
								<div className="pt-4">
									<H3 heading={t('pageSettings.title.manageOtherPasskeys')}>
									</H3>
									<WebauthnRegistation onSuccess={() => refreshData()} />
									<ul className="mt-4">

										{userData.webauthnCredentials
											.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id)
											.sort(compareBy((cred: WebauthnCredential) => new Date(cred.createTime)))
											.map(cred => (
												<WebauthnCredentialItem
													key={cred.id}
													credential={cred}
													prfKeyInfo={keystore.getPrfKeyInfo(cred.credentialId)}
													onDelete={showDelete && (() => deleteWebauthnCredential(cred))}
													onRename={onRenameWebauthnCredential}
													onUpgradePrfKey={onUpgradePrfKey}
												/>
											))}
										{userData.webauthnCredentials
											.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length === 0 && (
												<p className='dark:text-white'>{t('pageSettings.noOtherPasskeys')}</p>
											)}
									</ul>
								</div>

								<div className="pt-4">
									<H3 heading={t('pageSettings.deleteAccount.title')}>
										<UnlockMainKey
											unlocked={unlocked}
											onLock={() => setUnlocked(false)}
											onUnlock={() => setUnlocked(true)}
										/>
									</H3>
									<p className='mb-2 dark:text-white'>
										{t('pageSettings.deleteAccount.description')}
									</p>
									<Button
										id="delete-account"
										onClick={openDeleteConfirmation}
										variant="delete"
										disabled={!unlocked || !isOnline}
										title={unlocked && !isOnline ? t("common.offlineTitle") : !unlocked ? t("pageSettings.deleteAccount.deleteButtonTitleLocked") : ""}
									>
										<Trash2 size={18} />
										{t('pageSettings.deleteAccount.buttonText')}
									</Button>
								</div>
							</div>

						</div>
						<div className="my-2 py-2">
							<div className='relative'>
								<H2 heading={t('pageSettings.title.appVersion')} />
								{updateAvailable && (
									<Bell
										size={22}
										className="text-lm-green dark:text-dm-green absolute top-0 left-[105px]"
									/>
								)}
							</div>
							{updateAvailable ? (
								<p className='mb-2 dark:text-white'>
									<Trans
										i18nKey="pageSettings.appVersion.descriptionOldVersion"
										values={{ react_app_version: import.meta.env.VITE_APP_VERSION }}
										components={{
											reloadButton:
												<button
													id="reload-update-version"
													className='text-primary dark:text-brand-light underline'
													onClick={() => window.location.reload()}
												/>,
											strong: <strong />,
											br: <br />,
										}}
									/>
								</p>
							) : (
								<p className='mb-2 dark:text-white'>
									{t('pageSettings.appVersion.descriptionLatestVersion', { react_app_version: import.meta.env.VITE_APP_VERSION })}
								</p>
							)}

						</div>
					</>
				)}
				<DeletePopup
					isOpen={isDeleteConfirmationOpen}
					onConfirm={handleDelete}
					onClose={closeDeleteConfirmation}
					message={
						<Trans
							i18nKey="pageSettings.deleteAccount.message"
							components={{ strong: <strong /> }}
						/>
					}
					loading={loading}
				/>

				<Dialog
					open={upgradePrfState !== null}
					onCancel={onCancelUpgradePrfKey}
				>
					{upgradePrfState?.state === "authenticate"
						? <>
							<H2 heading={t('pageSettings.upgradePrfKey.title')} hr={false} flexJustifyContent='center'></H2>
							<p className='mb-2'>
								{t('pageSettings.upgradePrfKey.description', { passkeyLabel: upgradePrfPasskeyLabel })}
							</p>
							<div className='flex gap-2 justify-center align-center'>
								<Button
									onClick={onCancelUpgradePrfKey}
									>
										{t('common.cancel')}
								</Button>
							</div>
						</>
						: <>
							<H2 heading={t('pageSettings.upgradePrfKey.title')} hr={false} flexJustifyContent='center'></H2>
							<Trans
								i18nKey="pageSettings.upgradePrfKey.error"
								values={{ passkeyLabel: upgradePrfPasskeyLabel }}
								components={{ p: <p className='mb-2' /> }}
							/>
							<div className='flex gap-2 justify-center align-center'>
								<Button
									onClick={onCancelUpgradePrfKey}
									>
									{t('common.cancel')}
								</Button>
								<Button
									variant='primary'
									onClick={() => onUpgradePrfKey(upgradePrfState.prfKeyInfo)}
									>
									{t('common.tryAgain')}
								</Button>
							</div>
						</>
					}
				</Dialog>
			</div>
		</>
	);
};

export default Settings;
