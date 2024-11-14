import React, { FormEvent, KeyboardEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FaEdit, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { BsLock, BsPlusCircle, BsUnlock } from 'react-icons/bs';
import { MdNotifications } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";

import StatusContext from '../../context/StatusContext';
import SessionContext from '../../context/SessionContext';

import useScreenType from '../../hooks/useScreenType';

import { UserData, WebauthnCredential } from '../../api/types';
import { compareBy, toBase64Url } from '../../util';
import { formatDate } from '../../functions/DateFormat';
import type { WebauthnPrfEncryptionKeyInfo, WrappedKeyInfo } from '../../services/keystore';
import { isPrfKeyV2, serializePrivateData } from '../../services/keystore';

import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
import { H1, H2, H3 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';

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
			className="p-4 pt-8 text-center rounded md:space-y-6 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-700"
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
}: {
	unwrappingKey?: CryptoKey,
	onSuccess: () => void,
	wrappedMainKey?: WrappedKeyInfo,
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
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
	const screenType = useScreenType();

	const stateChooseNickname = Boolean(beginData) && !needPrfRetry;

	const onBegin = useCallback(
		async () => {
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

	const onFinish = async (event) => {
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

	const registrationInProgress = Boolean(beginData || pendingCredential);

	return (
		<>
			<Button
				onClick={onBegin}
				variant="primary"
				disabled={registrationInProgress || !unlocked || !isOnline}
				// title={!unlocked ? t("pageSettings.deletePasskeyButtonTitleLocked") : ""}

				ariaLabel={unlocked && !isOnline ? t("common.offlineTitle") : unlocked ? (screenType !== 'desktop' ? t('pageSettings.addPasskey') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
				title={unlocked && !isOnline ? t("common.offlineTitle") : unlocked ? (screenType !== 'desktop' ? t('pageSettings.addPasskeyTitle') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
			>
				<div className="flex items-center">
					<BsPlusCircle size={20} />
					<span className='hidden md:block ml-2'>
						{t('pageSettings.addPasskey')}
					</span>
				</div>
			</Button>

			<Dialog
				open={stateChooseNickname}
				onCancel={onCancel}
			>
				<form method="dialog" onSubmit={onFinish}>
					{pendingCredential
						? (
							<>
								<h3 className="text-2xl mt-4 mb-2 font-bold text-primary dark:text-white">{t('registerPasskey.messageSuccess')}</h3>
								<p className="mb-2 dark:text-white">{t('registerPasskey.giveNickname')}</p>
								<input
									type="text"
									className="border border-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride py-1.5 px-3"
									aria-label="Nickname for new credential"
									autoFocus={true}
									disabled={isSubmitting}
									onChange={(event) => setNickname(event.target.value)}
									placeholder="Credential nickname"
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
							onClick={onCancel}
							variant="cancel"
							disabled={isSubmitting}
						>
							{t('common.cancel')}
						</Button>

						{pendingCredential && (
							<Button
								type="submit"
								variant="secondary"
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
				<h3 className="text-2xl mt-4 mb-2 font-bold text-primary dark:text-white">{t('registerPasskey.messageDone')}</h3>
				<p className='dark:text-white'>{t('registerPasskey.passkeyCreated')}</p>
				<p className='dark:text-white'>{t('registerPasskey.authOnceMore')}</p>

				<div className='flex justify-center gap-2'>
					<Button
						onClick={() => resolvePrfRetryPrompt(false)}
						variant="cancel"
					>
						{t('common.cancel')}
					</Button>

					<Button
						onClick={() => resolvePrfRetryPrompt(true)}
						variant="secondary"
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
					<Button variant="cancel" onClick={onCancel}>
						{t('common.cancel')}
					</Button>
				</div>
			</Dialog>
		</>
	);
};

const UnlockMainKey = ({
	onLock,
	onUnlock,
	unlocked,
}: {
	onLock: () => void,
	onUnlock: (unwrappingKey: CryptoKey, wrappedMainKey: WrappedKeyInfo) => void,
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
				const [unwrappingKey, wrappedMainKey] = await keystore.getPasswordOrPrfKeyFromSession(
					() => new Promise<string>(resolve => {
						setResolvePasswordPromise(() => resolve);
					}).finally(() => {
						setResolvePasswordPromise(null);
						setPassword("");
					}),
					async () => true,
				);
				onUnlock(unwrappingKey, wrappedMainKey);
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
				onClick={unlocked ? onLock : onBeginUnlock}
				variant="primary"
				disabled={inProgress || (!unlocked && !isOnline)}
				ariaLabel={!unlocked && !isOnline ? t("common.offlineTitle") : screenType !== 'desktop' && (unlocked ? t('pageSettings.lockPasskeyManagement') : t('pageSettings.unlockPasskeyManagement'))}
				title={!unlocked && !isOnline ? t("common.offlineTitle") : screenType !== 'desktop' && (unlocked ? t('pageSettings.lockPasskeyManagementTitle') : t('pageSettings.unlockPasskeyManagementTitle'))}
			>
				<div className="flex items-center">
					{unlocked
						? <>
							<BsUnlock size={20} />
							<span className='hidden md:block ml-2'>
								{t('pageSettings.lockPasskeyManagement')}
							</span>
						</>
						: <>
							<BsLock size={20} />
							<span className='hidden md:block ml-2'>
								{t('pageSettings.unlockPasskeyManagement')}
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
						className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight"
						aria-label={t('pageSettings.unlockPassword.passwordInputAriaLabel')}
						autoFocus={true}
						disabled={isSubmittingPassword}
						onChange={(event) => setPassword(event.target.value)}
						placeholder={t('pageSettings.unlockPassword.passwordInputPlaceholder')}
						value={password}
					/>

					<div className="pt-2">
						<button
							type="button"
							className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer font-medium rounded-lg text-sm hover:bg-gray-100 mr-2"
							onClick={onCancelPassword}
							disabled={isSubmittingPassword}
						>
							{t('common.cancel')}
						</button>

						<button
							type="submit"
							className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700"
							disabled={isSubmittingPassword}
						>
							{t('common.submit')}
						</button>
					</div>

					{error &&
						<p className="text-red-500 mt-2">
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
	unlocked
}: {
	credential: WebauthnCredential,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
	onDelete?: false | (() => Promise<void>),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
	onUpgradePrfKey: (prfKeyInfo: WebauthnPrfEncryptionKeyInfo) => void,
	unlocked: boolean,
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
			className="mb-2 pl-4 bg-white dark:bg-gray-800 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md flex flex-row flex-wrap gap-y-2 overflow-x-auto"
			onSubmit={onSubmit}
		>
			<div className="grow">
				{editing
					? (
						<>
							<div className="flex items-center">
								<p className="font-semibold dark:text-white">
									{t('pageSettings.passkeyItem.nickname')}:&nbsp;
								</p>
								<input
									className="border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride py-1.5 px-3 w-36"

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
								<span className="font-bold text-primary dark:text-primary-light">
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
				<p className='dark:text-white'>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.canEncrypt')}:&nbsp;
					</span>
					{credential.prfCapable ? t('pageSettings.passkeyItem.canEncryptYes') : t('pageSettings.passkeyItem.canEncryptNo')}
					{needsPrfUpgrade
						&& <span className="font-semibold text-orange-500 ml-2">{t('pageSettings.passkeyItem.needsPrfUpgrade')}</span>
					}
				</p>
			</div>

			<div className="items-start	 flex inline-flex">
				{needsPrfUpgrade
					&&
					<button
						className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 inline-flex flex-row flex-nowrap items-center text-white font-medium rounded-lg text-sm px-4 py-2 text-center mr-2"
						type="button"
						onClick={() => onUpgradePrfKey(prfKeyInfo)}
						aria-label={t('pageSettings.passkeyItem.prfUpgradeAriaLabel', { passkeyLabel: currentLabel })}
					>
						<FaSyncAlt size={16} className="mr-2" /> {t('pageSettings.passkeyItem.prfUpgrade')}
					</button>
				}

				{editing
					? (

						<div className='flex gap-2'>
							<Button
								onClick={onCancelEditing}
								variant="cancel"
								disabled={submitting}
								ariaLabel={t('pageSettings.passkeyItem.cancelChangesAriaLabel', { passkeyLabel: currentLabel })}
							>
								{t('common.cancel')}
							</Button>
							<Button
								type="submit"
								disabled={submitting}
								variant="secondary"
							>
								{t('common.save')}
							</Button>
						</div>
					)
					: (
						<Button
							onClick={() => setEditing(true)}
							variant="secondary"
							disabled={(onDelete && !unlocked) || !isOnline}
							aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
							title={!isOnline ? t("common.offlineTitle") : onDelete && !unlocked && t("pageSettings.passkeyItem.renameButtonTitleLocked")}
						>
							<FaEdit size={16} className="mr-2" />
							{t('pageSettings.passkeyItem.rename')}
						</Button>
					)
				}

				{onDelete && (
					<Button
						onClick={openDeleteConfirmation}
						variant="delete"
						disabled={!unlocked || !isOnline}
						aria-label={t('pageSettings.passkeyItem.deleteAriaLabel', { passkeyLabel: currentLabel })}
						title={unlocked && !isOnline ? t("common.offlineTitle") : !unlocked ? t("pageSettings.passkeyItem.deleteButtonTitleLocked") : t("pageSettings.passkeyItem.deleteButtonTitleUnlocked", { passkeyLabel: currentLabel })}
						additionalClassName='ml-2 py-2.5'
					>
						<FaTrash size={16} />
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
	const [userData, setUserData] = useState<UserData>(null);
	const { webauthnCredentialCredentialId: loggedInPasskeyCredentialId } = api.getSession();
	const [unwrappingKey, setUnwrappingKey] = useState<CryptoKey | null>(null);
	const [wrappedMainKey, setWrappedMainKey] = useState<WrappedKeyInfo | null>(null);
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
	const showDelete = userData?.webauthnCredentials?.length > 1;
	const { t } = useTranslation();
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => setIsDeleteConfirmationOpen(false);
	const [upgradePrfState, setUpgradePrfState] = useState<UpgradePrfState | null>(null);
	const upgradePrfPasskeyLabel = useWebauthnCredentialNickname(upgradePrfState?.webauthnCredential);
	const [successMessage, setSuccessMessage] = useState('');

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

	const refreshData = useCallback(
		async () => {
			keystore; // eslint-disable-line @typescript-eslint/no-unused-expressions -- Silence react-hooks/exhaustive-deps
			try {
				const response = await api.get('/user/session/account-info');
				console.log(response.data);
				setUserData(response.data);
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

	return (
		<>
			<div className="sm:px-6 w-full">
				{userData && (
					<>
						<H1 heading={t('common.navItemSettings')} />
						<PageDescription description={t('pageSettings.description')} />

						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.title.loggedInPasskey')} />
							{loggedInPasskey && (
								<WebauthnCredentialItem
									key={loggedInPasskey.id}
									credential={loggedInPasskey}
									prfKeyInfo={keystore.getPrfKeyInfo(loggedInPasskey.credentialId)}
									onRename={onRenameWebauthnCredential}
									onUpgradePrfKey={onUpgradePrfKey}
									unlocked={unlocked}
								/>
							)}
						</div>
						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.title.rememberIssuer')} />
							<p className='mb-2 dark:text-white'>
								{t('pageSettings.rememberIssuer.description')}
							</p>
							<div className='flex gap-2 items-center'>
								<div className="relative inline-block min-w-36 text-gray-700">
									<div className="relative w-full h-10">
										<select
											className={`w-full h-10 pl-3 pr-10 border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride py-1.5 px-3 w-36 appearance-none`}
											defaultValue={userData.settings.openidRefreshTokenMaxAgeInSeconds}
											onChange={(e) => handleTokenMaxAgeChange(e.target.value)}
											disabled={!isOnline}
											title={!isOnline ? t("common.offlineTitle") : undefined}
										>
											<option value="0">{t('pageSettings.rememberIssuer.options.none')}</option>
											<option value="3600">{t('pageSettings.rememberIssuer.options.hour')}</option>
											<option value={`${24 * 3600}`}>{t('pageSettings.rememberIssuer.options.day')}</option>
											<option value={`${7 * 24 * 3600}`}>{t('pageSettings.rememberIssuer.options.week')}</option>
											<option value={`${30 * 24 * 3600}`}>{t('pageSettings.rememberIssuer.options.month')}</option>
										</select>
										<span className="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none">
											<IoIosArrowDown />
										</span>
									</div>
								</div>
								{successMessage && (
									<div className="text-md text-green-500">
										{successMessage}
									</div>
								)}
							</div>
						</div>
						<div className="mt-2 mb-2 py-2">
							<H2 heading={t('pageSettings.title.manageAcount')}>
								<UnlockMainKey
									unlocked={unlocked}
									onLock={() => {
										setUnwrappingKey(null);
										setWrappedMainKey(null);
									}}
									onUnlock={(unwrappingKey, wrappedMainKey) => {
										setUnwrappingKey(unwrappingKey);
										setWrappedMainKey(wrappedMainKey);
									}}
								/>
							</H2>
							<div className='mb-2'>
								<div className="pt-4">
									<H3 heading={t('pageSettings.title.manageOtherPasskeys')}>
										<WebauthnRegistation
											unwrappingKey={unwrappingKey}
											wrappedMainKey={wrappedMainKey}
											onSuccess={() => refreshData()}
										/>
									</H3>
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
													unlocked={unlocked}
												/>
											))}
										{userData.webauthnCredentials
											.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length === 0 && (
												<p className='dark:text-white'>{t('pageSettings.noOtherPasskeys')}</p>
											)}
									</ul>
								</div>

								<div className="pt-4">
									<H3 heading={t('pageSettings.deleteAccount.title')} />
									<p className='mb-2 dark:text-white'>
										{t('pageSettings.deleteAccount.description')}
									</p>
									<Button
										onClick={openDeleteConfirmation}
										variant="delete"
										disabled={!unlocked || !isOnline}
										title={unlocked && !isOnline ? t("common.offlineTitle") : !unlocked ? t("pageSettings.deleteAccount.deleteButtonTitleLocked") : ""}
									>
										{t('pageSettings.deleteAccount.buttonText')}
									</Button>
								</div>
							</div>

						</div>
						<div className="my-2 py-2">
							<div className='relative'>
								<H2 heading={t('pageSettings.title.appVersion')} />
								{updateAvailable && (
									<MdNotifications
										size={22}
										className="text-green-500 absolute top-0 left-[105px]"
									/>
								)}
							</div>
							{updateAvailable ? (
								<p className='mb-2 dark:text-white'>
									<Trans
										i18nKey="pageSettings.appVersion.descriptionOldVersion"
										values={{ react_app_version: process.env.REACT_APP_VERSION }}
										components={{
											reloadButton: <button className='text-primary dark:text-extra-light underline' onClick={() => window.location.reload()} />, strong: <strong />, br: <br />,
										}}
									/>
								</p>
							) : (
								<p className='mb-2 dark:text-white'>
									{t('pageSettings.appVersion.descriptionLatestVersion', { react_app_version: process.env.REACT_APP_VERSION })}
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
							<h1 className="font-semibold text-gray-700 my-2">{t('pageSettings.upgradePrfKey.title')}</h1>
							<p className='mb-2'>
								{t('pageSettings.upgradePrfKey.description', { passkeyLabel: upgradePrfPasskeyLabel })}
							</p>
							<button
								type="button"
								className="bg-white px-4 py-2 border border-gray-300 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100 mr-2"
								onClick={onCancelUpgradePrfKey}
							>
								{t('common.cancel')}
							</button>
						</>
						: <>
							<h1 className="font-semibold text-gray-700 my-2">{t('pageSettings.upgradePrfKey.title')}</h1>
							<Trans
								i18nKey="pageSettings.upgradePrfKey.error"
								values={{ passkeyLabel: upgradePrfPasskeyLabel }}
								components={{ p: <p className='mb-2' /> }}
							/>
							<button
								type="button"
								className="bg-white px-4 py-2 border border-gray-300 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100 mr-2"
								onClick={onCancelUpgradePrfKey}
							>
								{t('common.cancel')}
							</button>
							<button
								type="button"
								className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium rounded-lg text-sm px-4 py-2 text-center mr-2"
								onClick={() => onUpgradePrfKey(upgradePrfState.prfKeyInfo)}
							>
								{t('common.tryAgain')}
							</button>
						</>
					}
				</Dialog>
			</div>
		</>
	);
};

export default Settings;
