import React, { FormEvent, KeyboardEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faMessageDots, faPen, faPlus, faSyncAlt, faTrash } from '@fortawesome/pro-regular-svg-icons';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import { UserData, WebauthnCredential } from '@/api/types';

import { formatDate } from '@/functions/DateFormat';

import useScreenType from '@/hooks/useScreenType';

import { isPrfKeyV2, serializePrivateData } from '@/services/keystore';
import type { WebauthnPrfEncryptionKeyInfo, WrappedKeyInfo } from '@/services/keystore';

import { compareBy, toBase64Url } from '@/util';

import Button from '@/components/Buttons/Button';
import DeletePopup from '@/components/Popups/DeletePopup';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import LanguageSelector from '@/components/LanguageSelector/LanguageSelector';
import RememberIssuerSelector from "@/components/RememberIssuerSelector/RememberIssuerSelector";

function useWebauthnCredentialNickname(credential: WebauthnCredential): string {
	//General
	const { t } = useTranslation();

	//Render
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
	//Refs
	const dialog = useRef<HTMLDialogElement>();

	//State
	const [isClosing, setIsClosing] = useState(false);

	//Effects
	useEffect(() => {
		if (dialog.current) {
			if (open) {
				dialog.current.showModal();
			} else {
				setIsClosing(true);
				setTimeout(() => {
					dialog.current.close();
					setIsClosing(false);
				}, 200);
			}
		}
	}, [dialog, open]);

	//Render
	return (
		<dialog
			ref={dialog}
			className={`
				p-6 text-center sm:p-8 rounded-xl shadow-lg bg-c-lm-gray-100 dark:bg-c-dm-gray-900 border border-c-lm-gray-300 dark:border-c-dm-gray-800
				dialog-backdrop-opening ${isClosing ? 'dialog-backdrop-closing' : ''}
				dialog-layout-opening ${isClosing ? 'dialog-layout-closing' : ''}
			`}
			style={{ minWidth: '30%' }}
			onCancel={onCancel}
		>
			{children}
		</dialog>
	);
};

const WebauthnRegistation = ({
	unwrappingKey,
	onSuccess,
	wrappedMainKey,
	ensureUnlocked,
	size='lg',
	disabled=false,
	additionalClassName='',
	short=false,
}: {
	unwrappingKey?: CryptoKey,
	onSuccess: () => void,
	wrappedMainKey?: WrappedKeyInfo,
	ensureUnlocked: () => Promise<boolean>,
	size: 'lg' | 'md' | 'sm',
	disabled?: boolean,
	additionalClassName?: string,
	short?: boolean,
}) => {
	//General
	const { t } = useTranslation();
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);

	//State
	const [nickname, setNickname] = useState("");
	const [beginData, setBeginData] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const [pendingCredential, setPendingCredential] = useState(null);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<null | ((accept: boolean) => void)>(null);
	
	//Variables
	const screenType = useScreenType();
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
	const stateChooseNickname = Boolean(beginData) && !needPrfRetry;

	//Handlers
	const onBegin = useCallback(
		async () => {
			const isUnlocked = await ensureUnlocked();
			if (!isUnlocked) {
				return;
			}

			setBeginData(null);
			setIsSubmitting(true);
			setPendingCredential(null);

			const beginResp = await api.post('/user/session/webauthn/register-begin', {});
			console.log("begin", beginResp);
			const beginData = beginResp.data;

			if (beginData.challengeId) {
				setBeginData(beginData);

				try {
					const credential = await navigator.credentials.create(beginData.createOptions);
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

	const onFinish = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("onFinish", event);

		if (beginData && pendingCredential && unwrappingKey && wrappedMainKey) {
			try {
				const [newPrivateData, keystoreCommit] = await keystore.addPrf(
					pendingCredential,
					[unwrappingKey, wrappedMainKey],
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
			console.error("Invalid state:", beginData, pendingCredential, unwrappingKey, wrappedMainKey);
		}
	};

	//Prepare for render
	const registrationInProgress = Boolean(beginData || pendingCredential);

	//Render
	return (
		<>
			<Button
			id="add-passkey-settings"
			variant="tertiary"
			onClick={onBegin}
			disabled={registrationInProgress || !isOnline || disabled}
			ariaLabel={unlocked && !isOnline ? t("common.offlineTitle") : unlocked ? (screenType !== 'desktop' ? t('pageSettings.addPasskey') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
			title={unlocked && !isOnline ? t("common.offlineTitle") : unlocked ? (screenType !== 'desktop' ? t('pageSettings.addPasskeyTitle') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
			size={size}
			textSize='md'
			additionalClassName={additionalClassName}
			>
				<FontAwesomeIcon icon={faPlus} className="text-md mr-3" />

				{short ? t('pageSettings.addPasskeyShort') : t('pageSettings.addPasskey')}
			</Button>

			<Dialog
			open={stateChooseNickname}
			onCancel={onCancel}
			>
				<form method="dialog" onSubmit={onFinish}>
					{pendingCredential ? 
						<>
							<h3 className="text-2xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
								{t('registerPasskey.messageSuccess')}
							</h3>

							<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-4">
								{t('registerPasskey.giveNickname')}
							</p>

							<input
								type="text"
								className={`
									mt-6 border rounded-lg py-1.5 px-3 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 text-center
									border-c-lm-gray-300 dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 dark:inputDarkModeOverride
									outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
									placeholder:text-c-lm-gray-700 dark:placeholder:text-c-dm-gray-300
								`}
								aria-label={t('registerPasskey.nicknameAriaLabel')}
								autoFocus={true}
								disabled={isSubmitting}
								onChange={(event) => setNickname(event.target.value)}
								placeholder={t('registerPasskey.nicknamePlaceholder')}
								value={nickname}
							/>
						</>
					:
						<p className='text-c-lm-gray-900 dark:text-c-dm-gray-100'>
							{t('registerPasskey.messageInteract')}
						</p>
					}

					<div className="mt-6 flex justify-center gap-2">
						<Button
							id="cancel-add-passkey-settings"
							onClick={onCancel}
							disabled={isSubmitting}
							variant="cancel"
							size='md'
							textSize='md'
						>
							{t('common.cancel')}
						</Button>

						{pendingCredential &&
							<Button
								id="save-add-passkey-settings"
								type="submit"
								variant="tertiary"
								size='md'
								textSize='md'
								disabled={isSubmitting}
							>
								{t('common.save')}
							</Button>
						}
					</div>
				</form>
			</Dialog>

			<Dialog
				open={needPrfRetry && !prfRetryAccepted}
				onCancel={() => resolvePrfRetryPrompt(false)}
			>
				<h3 className="text-2xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
					{t('registerPasskey.messageDone')}
				</h3>

				<p className='text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-4'>
					{t('registerPasskey.passkeyCreated')}
				</p>

				<p className='text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-2'>
					{t('registerPasskey.authOnceMore')}
				</p>

				<div className='flex justify-center gap-2 mt-6'>
					<Button
						id="cancel-prf-passkey-settings"
						onClick={() => resolvePrfRetryPrompt(false)}
						variant="cancel"
						size='md'
						textSize='md'
					>
						{t('common.cancel')}
					</Button>

					<Button
						id="continue-prf-passkey-settings"
						onClick={() => resolvePrfRetryPrompt(true)}
						variant="tertiary"
						size='md'
						textSize='md'
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
				<p className='text-c-lm-gray-900 dark:text-c-dm-gray-100'>
					{t('registerPasskey.messageInteractNewPasskey')}
				</p>

				<div className='flex justify-center mt-6'>
					<Button
						id="cancel-in-progress-prf-settings"
						variant="cancel"
						size='md'
						textSize='md'
						onClick={onCancel}
					>
						{t('common.cancel')}
					</Button>
				</div>
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
	unlocked
}: {
	credential: WebauthnCredential,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
	onDelete?: false | (() => Promise<void>),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
	onUpgradePrfKey: (prfKeyInfo: WebauthnPrfEncryptionKeyInfo) => void,
	unlocked: boolean,
}) => {
	//General
	const { t } = useTranslation();
	const { isOnline } = useContext(StatusContext);
	const currentLabel = useWebauthnCredentialNickname(credential);
	
	//State
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [nickname, setNickname] = useState(credential.nickname || '');
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

	//Refs
	const inputRef = useRef<HTMLInputElement>(null);

	//Effects
	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
		}
	}, [editing]);
	
	//Handlers
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

	const onCancelEditing = useCallback(() => {
		setNickname(credential.nickname || '');
		setEditing(false);
	}, [credential.nickname]);

	const onKeyUp = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Escape") {
			onCancelEditing();
		}
	}, [onCancelEditing]);

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

	//Prepare for render
	const needsPrfUpgrade = prfKeyInfo && !isPrfKeyV2(prfKeyInfo);

	//Render
	return (
		<form
			className="mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600 overflow-x-auto"
			onSubmit={onSubmit}
		>
			<div className="pl-4 sm:pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600">
				<h2 className={`text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
					{t('pageSettings.passkeyItem.title')}
				</h2>

				<div className="items-start	flex inline-flex">
					{needsPrfUpgrade &&
						<Button
							id="upgrade-prf-settings"
							onClick={() => onUpgradePrfKey(prfKeyInfo)}
							ariaLabel={t('pageSettings.passkeyItem.prfUpgradeAriaLabel', { passkeyLabel: currentLabel })}
							variant="tertiary"
							size='md'
							textSize='md'
							additionalClassName='mr-2'
						>
							<FontAwesomeIcon icon={faSyncAlt} className="text-lg mr-3" />
							
							{t('pageSettings.passkeyItem.prfUpgrade')}
						</Button>
					}

					{editing ?
						<div className='flex gap-2'>
							<Button
								id="cancel-editing-settings"
								onClick={onCancelEditing}
								disabled={submitting}
								ariaLabel={t('pageSettings.passkeyItem.cancelChangesAriaLabel', { passkeyLabel: currentLabel })}
								variant="cancel"
								size='md'
								textSize='md'
							>
								{t('common.cancel')}
							</Button>
							
							<Button
								id="save-editing-settings"
								type="submit"
								disabled={submitting}
								variant="tertiary"
								size='md'
								textSize='md'
							>
								{t('common.save')}
							</Button>
						</div>
					:
						<Button
							id="rename-passkey"
							onClick={() => setEditing(true)}
							disabled={(onDelete && !unlocked) || !isOnline}
							aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
							title={!isOnline ? t("common.offlineTitle") : onDelete && !unlocked && t("pageSettings.passkeyItem.renameButtonTitleLocked")}
							variant="tertiary"
							size='md'
							textSize='md'
						>
							<FontAwesomeIcon icon={faPen} className='mr-3' />
							
							{t('pageSettings.passkeyItem.rename')}
						</Button>
					}

					{onDelete && 
						<Button
							id="delete-passkey"
							onClick={openDeleteConfirmation}
							variant="delete"
							size='lg'
							square={true}
							textSize='md'
							disabled={!unlocked || !isOnline}
							aria-label={t('pageSettings.passkeyItem.deleteAriaLabel', { passkeyLabel: currentLabel })}
							title={unlocked && !isOnline ? t("common.offlineTitle") : !unlocked ? t("pageSettings.passkeyItem.deleteButtonTitleLocked") : t("pageSettings.passkeyItem.deleteButtonTitleUnlocked", { passkeyLabel: currentLabel })}
							additionalClassName='ml-2'
						>
							<FontAwesomeIcon icon={faTrash} className="text-lg" fixedWidth />
						</Button>
					}

					<DeletePopup
						isOpen={isDeleteConfirmationOpen}
						onConfirm={handleDelete}
						onClose={closeDeleteConfirmation}
						title={t('pageSettings.title.confirmDeleteAccountPopup')}
						message={
							<Trans
								i18nKey="pageSettings.passkeyItem.messageDeletePasskey"
								values={{ nickname: nickname }}
							/>
						}
						loading={loading}
					/>
				</div>
			</div>
			
			<div className="p-4 sm:p-6 flex flex-col grow">
				<div className="flex flex-col sm:flex-row sm:items-center">
					<p className="flex-1 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageSettings.passkeyItem.nickname')}
					</p>

					<div className="flex-5 flex items-center mt-2 sm:mt-0">
						<p className={`text-c-lm-gray-900 dark:text-c-dm-gray-100 ${editing ? 'opacity-0' : ''}`}>
							{currentLabel}
						</p>

						{editing &&
							<input
								ref={inputRef}
								className={`
									absolute max-w-64 w-full border rounded-lg py-1.5 px-3 -ml-[calc(0.75rem+1px)] bg-c-lm-gray-200 dark:bg-c-dm-gray-800
									border-c-lm-gray-300 dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 dark:inputDarkModeOverride
									outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
									placeholder:text-c-lm-gray-700 dark:placeholder:text-c-dm-gray-300
								`}
								type="text"
								placeholder={t('pageSettings.passkeyItem.nicknameInput')}
								value={nickname}
								onChange={(event) => setNickname(event.target.value)}
								aria-label={t('pageSettings.passkeyItem.nicknameInputAriaLabel', { passkeyLabel: currentLabel })}
								onKeyUp={onKeyUp}
								disabled={submitting}
							/>
						}
					</div>
				</div>
				
				<div className="flex flex-col sm:flex-row sm:items-center mt-4">
					<p className="flex-1 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageSettings.passkeyItem.created')}
					</p>

					<p className="flex-5 text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-2 sm:mt-0">
						{formatDate(credential.createTime)}
					</p>
				</div>
				
				<div className="flex flex-col sm:flex-row sm:items-center mt-4">
					<p className="flex-1 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageSettings.passkeyItem.lastUsed')}
					</p>

					<p className="flex-5 text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-2 sm:mt-0">
						{formatDate(credential.lastUseTime)}
					</p>
				</div>
				
				<div className="flex flex-col sm:flex-row sm:items-center mt-4">
					<p className="flex-1 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageSettings.passkeyItem.canEncrypt')}
					</p>

					<p className="flex-5 text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-2 sm:mt-0">
						{credential.prfCapable ? t('pageSettings.passkeyItem.canEncryptYes') : t('pageSettings.passkeyItem.canEncryptNo')}
						
						{needsPrfUpgrade && 
							<span className="font-semibold text-orange-500 ml-2">{t('pageSettings.passkeyItem.needsPrfUpgrade')}</span>
						}
					</p>
				</div>
			</div>
		</form>
	);
};

const Settings = () => {
	//General
	const { t } = useTranslation();
	const { api, logout, keystore } = useContext(SessionContext);
	const { isOnline, updateAvailable } = useContext(StatusContext);
	
	//State
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [unlockError, setUnlockError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [userData, setUserData] = useState<UserData>(null);
	const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
	const [unwrappingKey, setUnwrappingKey] = useState<CryptoKey | null>(null);
	const [isPromptingForPassword, setIsPromptingForPassword] = useState(false);
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [wrappedMainKey, setWrappedMainKey] = useState<WrappedKeyInfo | null>(null);
	const [upgradePrfState, setUpgradePrfState] = useState<UpgradePrfState | null>(null);
	const [resolvePasswordPromise, setResolvePasswordPromise] = useState<((password: string | null) => void) | null>(null);

	//Variables
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
	const showDelete = userData?.webauthnCredentials?.length > 1;

	const { webauthnCredentialCredentialId: loggedInPasskeyCredentialId } = api.getSession();

	const upgradePrfPasskeyLabel = useWebauthnCredentialNickname(upgradePrfState?.webauthnCredential);

	//Effects
	const refreshData = useCallback(async () => {
		keystore; // eslint-disable-line @typescript-eslint/no-unused-expressions -- Silence react-hooks/exhaustive-deps
		try {
			const response = await api.get('/user/session/account-info');
			console.log(response.data);
			setUserData(response.data);
			dispatchEvent(new CustomEvent("settingsChanged"));
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [
		api,
		keystore, // To react if credentials are modified in a different tab
		setUserData
	]);

	useEffect(() => {
		refreshData();
	}, [refreshData]);

	//Handlers
	const ensureUnlocked = async () => {
		if (unlocked) {
			return true; // Already unlocked
		}
		try {
			const [key, mainKey] = await keystore.getPasswordOrPrfKeyFromSession(
				() => new Promise<string | null>(resolve => {
					setResolvePasswordPromise(() => resolve);
					setIsPromptingForPassword(true);
					setUnlockError(""); // Clear previous errors
				}).finally(() => {
					setResolvePasswordPromise(null);
					setIsPromptingForPassword(false);
					setPassword("");
				}),
				async () => true, // We always want to try PRF if available
			);
			setUnwrappingKey(key);
			setWrappedMainKey(mainKey);
			setUnlockError(""); // Clear error on success
			return true;
		} catch (e) {
			console.error("Unlock failed", e);
			// Using a switch here so the t() argument can be a literal, to ease searching
			switch (e?.cause?.errorId) {
				case 'passkeyInvalid':
					setUnlockError(t('passkeyInvalid'));
					break;
				case 'passkeyLoginFailedTryAgain':
					setUnlockError(t('passkeyLoginFailedTryAgain'));
					break;
				case 'passwordUnlockFailed':
					setUnlockError(t('passwordUnlockFailed'));
					// Re-trigger password prompt automatically for password failure
					ensureUnlocked(); 
					break;
				case 'cancelled': // User cancelled the passkey/password prompt
					setUnlockError(""); // No error message needed for cancellation
					break;
				default:
					// Use a generic error message for other unexpected errors
					setUnlockError(t('pageSettings.unlockPassword.genericError')); 
					break;
			}
			setUnwrappingKey(null); // Ensure state reflects locked status on error
			setWrappedMainKey(null);
			return false;
		} finally {
			setIsSubmittingPassword(false); // Ensure this is reset
		}
	};

	const onSubmitPassword = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (resolvePasswordPromise) {
			setIsSubmittingPassword(true);
			setUnlockError(""); // Clear error before submitting
			resolvePasswordPromise(password);
		}
	};

	const onCancelPassword = () => {
		if (resolvePasswordPromise) {
			resolvePasswordPromise(null); // Resolve with null to indicate cancellation
		}
		setIsPromptingForPassword(false);
		setUnlockError(""); // Clear any displayed error
	};

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => setIsDeleteConfirmationOpen(false);

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
			setLoading(true);
			await deleteAccount();
			closeDeleteConfirmation();
			setLoading(false);
		}
	};

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

	const handleTokenMaxAgeChange = async (newMaxAge: string) => {
		try {
			await api.post('/user/session/settings', {
				openidRefreshTokenMaxAgeInSeconds: parseInt(newMaxAge),
			});
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

	// Handler for the new RememberIssuerSelector component
	const handleRememberIssuerChange = (newValue: number) => {
		handleTokenMaxAgeChange(String(newValue)); // Convert number back to string for the existing handler
	};

	//Prepare for render
	const loggedInPasskey = userData?.webauthnCredentials.find(
		cred => toBase64Url(cred.credentialId) === loggedInPasskeyCredentialId
	);

	//Render
	return (
		<div className="px-4 sm:px-8 lg:px-12 pt-10 pb-20 w-full max-w-[1064px] mx-auto">
			{userData && 
				<>
					<h1 className="text-2xl font-semibold leading-tight tracking-tight text-c-lm-gray-900 md:text-3xl dark:text-c-dm-gray-100">
						{t('common.navItemSettings')}
					</h1>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{t('pageSettings.description')}
					</p>

					<div className="mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600">
						<div className="pl-4 sm:pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600">
							<h2 className={`text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
								{t('pageSettings.title.preferences')}
							</h2>

							<div className='h-10' />
						</div>

						<div className="p-4 sm:p-6 flex flex-col items-start">
							<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300">
								{"Set your desired langague for the wwWallet website."}
							</p>

							<LanguageSelector 
								className='mt-4'
								verticalPosition='bottom'
								horizontalPosition='left'
							/>
							
							<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-6">
								{"Set your desired theme for the wwWallet website."}
							</p>

							<ThemeSelector 
								className='mt-4'
								verticalPosition='bottom'
								horizontalPosition='left'
							/>
						</div>
					</div>
					
					{loggedInPasskey && 
						<WebauthnCredentialItem
							key={loggedInPasskey.id}
							credential={loggedInPasskey}
							prfKeyInfo={keystore.getPrfKeyInfo(loggedInPasskey.credentialId)}
							onRename={onRenameWebauthnCredential}
							onUpgradePrfKey={onUpgradePrfKey}
							unlocked={unlocked}
						/>
					}

					<div className="mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600">
						<div className="pl-4 sm:pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600">
							<h2 className={`text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
								{t('pageSettings.title.rememberIssuer')}
							</h2>

							<div className='h-10' />
						</div>

						<div className="p-4 sm:p-6 flex flex-col items-start">
							<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300">
								{t('pageSettings.rememberIssuer.description')}
							</p>

							<div className='flex gap-4 items-center mt-4'>
								<RememberIssuerSelector
									currentValue={userData.settings.openidRefreshTokenMaxAgeInSeconds}
									onChange={handleRememberIssuerChange}
									disabled={!isOnline}
								/>
								
								<div className={`text-md text-c-lm-green dark:text-c-dm-green ${successMessage ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"} transition-all duration-150`}>
									{successMessage || "Saved"}
								</div>
							</div>
						</div>
					</div>
					
					<div className="mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600">
						<div className="pl-4 sm:pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600">
							<h2 className={`truncate mr-4 sm:mr-0 text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
								{t('pageSettings.title.manageOtherPasskeys')}
							</h2>

							<WebauthnRegistation
								unwrappingKey={unwrappingKey}
								wrappedMainKey={wrappedMainKey}
								onSuccess={refreshData}
								ensureUnlocked={ensureUnlocked}
								size='md'
								disabled={userData.webauthnCredentials.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length <= 0}
								short={window.innerWidth < 640}
							/>
						</div>

						{userData.webauthnCredentials.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length <= 0 &&
							<div className="px-4 sm:px-6 py-24 flex flex-col items-center">
								<h3 className="text-center text-lg font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
									{t('pageSettings.noOtherPasskeysTitle')}
								</h3>
								
								<p className="text-center text-c-lm-gray-700 dark:text-c-dm-gray-300 max-w-lg text-center mt-6">
									{t('pageSettings.noOtherPasskeysDescription')}
								</p>

								<WebauthnRegistation
									unwrappingKey={unwrappingKey}
									wrappedMainKey={wrappedMainKey}
									onSuccess={refreshData}
									ensureUnlocked={ensureUnlocked}
									additionalClassName='mt-8'
									size='lg'
								/>
							</div>
						}
						
						{userData.webauthnCredentials.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length > 0 &&
							<div className="p-4 sm:p-6">
								<ul className="">
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
											unlocked={unlocked}
										/>
									))}
								</ul>
							</div>
						}
					</div>
					
					<div className="mt-11 rounded-lg border border-c-lm-gray-400 dark:border-c-dm-gray-600">
						<div className="pl-4 sm:pl-6 py-4 pr-4 flex flex-row items-center justify-between border-b border-c-lm-gray-400 dark:border-c-dm-gray-600">
							<h2 className={`text-xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100`}>
								{t('pageSettings.deleteAccount.title')}
							</h2>

							<div className='h-10' />
						</div>

						<div className="p-4 sm:p-6 flex flex-col items-start">
							<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300">
								{t('pageSettings.deleteAccount.description')}
							</p>

							<Button
								additionalClassName='mt-4'
								id="delete-account"
								onClick={async () => {
									const isUnlocked = await ensureUnlocked();
									if (isUnlocked) {
										// If already unlocked, trigger action immediately
										openDeleteConfirmation();
									}
									// Otherwise, ensureUnlocked will handle triggering via password prompt callback
								}}
								variant="delete"
								disabled={!isOnline}
								title={!isOnline ? t("common.offlineTitle") : ""}
								size='lg'
								textSize='md'
							>
								{t('pageSettings.deleteAccount.buttonText')}
							</Button>
						</div>
					</div>

					<div className="relative flex flex-col items-center justify-center mt-20 px-4">
						{updateAvailable && 
							<div className='mb-6 bg-c-lm-red-bg dark:bg-c-dm-red-bg rounded-full flex items-center justify-center h-12 w-12'>
								<FontAwesomeIcon
									fixedWidth
									icon={faBell}
									className="text-lg text-c-lm-red dark:text-c-dm-red"
								/>
							</div>
						}

						{updateAvailable ?
							<p className='text-c-lm-gray-700 dark:text-c-dm-gray-300 text-center text-md'>
								<Trans
									i18nKey="pageSettings.appVersion.descriptionOldVersion"
									values={{ react_app_version: import.meta.env.VITE_APP_VERSION }}
									components={{
										reloadButton:
											<Button
												id="reload-update-version"
												variant="link"
												onClick={() => window.location.reload()}
											/>,
										strong: <strong />,
										br: <br />,
									}}
								/>
							</p>
						:
							<p className='text-c-lm-gray-700 dark:text-c-dm-gray-300 text-center text-md'>
								{t('pageSettings.appVersion.descriptionLatestVersion', { react_app_version: import.meta.env.VITE_APP_VERSION })}
							</p>
						}
					</div>
				</>
			}

			<DeletePopup
				isOpen={isDeleteConfirmationOpen}
				onConfirm={handleDelete}
				onClose={closeDeleteConfirmation}
				title={t('pageSettings.title.confirmDeleteAccountPopup')}
				message={
					<Trans
						i18nKey="pageSettings.deleteAccount.message"
					/>
				}
				loading={loading}
			/>

			<Dialog
				open={upgradePrfState !== null}
				onCancel={onCancelUpgradePrfKey}
			>
				{upgradePrfState?.state === "authenticate" ? 
					<>
						<h3 className="text-2xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
							<Trans
								i18nKey="pageSettings.upgradePrfKey.title"
								components={{ br: <br /> }}
							/>
						</h3>

						<p className='text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-4'>
							<Trans
								i18nKey="pageSettings.upgradePrfKey.description"
								values={{ passkeyLabel: upgradePrfPasskeyLabel }}
								components={{ strong: <strong /> }}
							/>
						</p>

						<div className='flex justify-center gap-2 mt-6'>
							<Button
								onClick={onCancelUpgradePrfKey}
								variant="cancel"
								size='md'
								textSize='md'
							>
								{t('common.cancel')}
							</Button>
						</div>
					</>
				: 
					<>
						<h3 className="text-2xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100 pb-2">
							<Trans
								i18nKey="pageSettings.upgradePrfKey.title"
								components={{ br: <br /> }}
							/>
						</h3>

						<Trans
							i18nKey="pageSettings.upgradePrfKey.error"
							values={{ passkeyLabel: upgradePrfPasskeyLabel }}
							components={{ p: <p className='text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-2' />, strong: <strong /> }}
						/>

						<div className='flex justify-center gap-2 mt-6'>
							<Button
								onClick={onCancelUpgradePrfKey}
								variant="cancel"
								size='md'
								textSize='md'
							>
								{t('common.cancel')}
							</Button>

							<Button
								onClick={() => onUpgradePrfKey(upgradePrfState.prfKeyInfo)}
								variant="tertiary"
								size='md'
								textSize='md'
							>
								{t('common.tryAgain')}
							</Button>
						</div>
					</>
				}
			</Dialog>

			<Dialog
				open={isPromptingForPassword}
				onCancel={onCancelPassword}
			>
				<form method="dialog" onSubmit={onSubmitPassword}>
					<h3 className="text-2xl font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{t('pageSettings.unlockPassword.title')}
					</h3>

					<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mt-4">
						{t('pageSettings.unlockPassword.description')}
					</p>
					
					<input
						type="password"
						className={`
							mt-6 border rounded-lg py-1.5 px-3 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 text-center
							border-c-lm-gray-300 dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 dark:inputDarkModeOverride
							outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
							placeholder:text-c-lm-gray-700 dark:placeholder:text-c-dm-gray-300
						`}
						aria-label={t('pageSettings.unlockPassword.passwordInputAriaLabel')}
						autoFocus={true}
						disabled={isSubmittingPassword}
						onChange={(event) => setPassword(event.target.value)}
						placeholder={t('pageSettings.unlockPassword.passwordInputPlaceholder')}
						value={password}
					/>

					<div className="flex justify-center gap-2 mt-6">
						<Button
							id="cancel-password-management-settings"
							type="button"
							variant="cancel"
							size='md'
							textSize='md'
							onClick={onCancelPassword}
							disabled={isSubmittingPassword}
						>
							{t('common.cancel')}
						</Button>

						<Button	
							id="submit-password-management-settings"
							type="submit"
							variant="tertiary"
							size='md'
							textSize='md'
							disabled={isSubmittingPassword}
						>
							{t('common.submit')}
						</Button>
					</div>

					{unlockError &&
						<p className="text-red-500 mt-2">
							{unlockError}
						</p>
					}
				</form>
			</Dialog>
		</div>
	);
};

export default Settings;
