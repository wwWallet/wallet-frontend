import React, { FormEvent, KeyboardEvent, useCallback, useContext, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FaEdit, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { BsLock, BsMoonFill, BsSunFill, BsUnlock } from 'react-icons/bs';
import { MdNotifications } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import AppSettingsContext from '@/context/AppSettingsContext';

import useScreenType from '../../hooks/useScreenType';

import { UserData, WebauthnCredential } from '../../api/types';
import { compareBy, toBase64Url } from '../../util';
import { withAuthenticatorAttachmentFromHints } from '@/util-webauthn';
import { formatDate } from '../../functions/DateFormat';
import type { PrecreatedPublicKeyCredential, WebauthnPrfEncryptionKeyInfo, WrappedKeyInfo } from '../../services/keystore';
import { isPrfKeyV2, serializePrivateData } from '../../services/keystore';

import Button from '../../components/Buttons/Button';
import DeletePopup from '../../components/Popups/DeletePopup';
import Dialog from '../../components/Dialog';
import { H1, H2, H3 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { GoDeviceMobile, GoKey, GoPasskeyFill } from 'react-icons/go';
import { FaLaptop, FaMobile } from "react-icons/fa";

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
	const [pendingCredential, setPendingCredential] = useState<PrecreatedPublicKeyCredential | null>(null);
	const [nickname, setNickname] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<null | ((accept: boolean) => void)>(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const { t } = useTranslation();
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
	const screenType = useScreenType();

	const stateChooseNickname = Boolean(beginData) && !resolvePrfRetryPrompt;

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
					const credential = await keystore.beginAddPrf(createOptions);
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
		[api, keystore],
	);

	const onCancel = () => {
		console.log("onCancel");
		setPendingCredential(null);
		setBeginData(null);
		setResolvePrfRetryPrompt(null);
		setPrfRetryAccepted(false);
		setIsSubmitting(false);
	};

	const onFinish = async (event) => {
		event.preventDefault();
		console.log("onFinish", event);

		if (beginData && pendingCredential && unwrappingKey && wrappedMainKey) {
			try {
				const [newPrivateData, keystoreCommit] = await keystore.finishAddPrf(
					pendingCredential,
					[unwrappingKey, wrappedMainKey],
					async () => {
						return new Promise<boolean>((resolve, reject) => {
							setResolvePrfRetryPrompt(() => resolve);
						}).finally(() => {
							setPrfRetryAccepted(true);
							setResolvePrfRetryPrompt(null);
						});
					},
				);

				const { credential } = pendingCredential;

				setIsSubmitting(true);
				api.updatePrivateDataEtag(await api.post('/user/session/webauthn/register-finish', {
					challengeId: beginData.challengeId,
					nickname,
					credential: {
						type: credential.type,
						id: credential.id,
						rawId: credential.rawId,
						response: {
							attestationObject: credential.response.attestationObject,
							clientDataJSON: credential.response.clientDataJSON,
							transports: credential.response.getTransports(),
						},
						authenticatorAttachment: credential.authenticatorAttachment,
						clientExtensionResults: credential.getClientExtensionResults(),
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
		<div className="flex flex-row flex-wrap items-baseline gap-2">
			<span className="flex-grow">{t('pageSettings.addPasskey')}</span>
			{
				[
					{ hint: "client-device", btnLabel: t('common.platformPasskey'), Icon: GoPasskeyFill },
					{ hint: "security-key", btnLabel: t('common.externalPasskey'), Icon: GoKey },
					{ hint: "hybrid", btnLabel: t('common.hybridPasskey'), Icon: GoDeviceMobile },
				].map(({ Icon, hint, btnLabel }) => (
					<Button
						key={hint}
						id={`add-passkey-settings-${hint}`}
						onClick={() => onBegin(hint)}
						variant="primary"
						disabled={registrationInProgress || !unlocked || !isOnline}
						ariaLabel={unlocked && !isOnline ? t("common.offlineTitle") : unlocked ? (screenType !== 'desktop' ? t('pageSettings.addPasskey') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
						title={unlocked && !isOnline ? t("common.offlineTitle") : unlocked ? (screenType !== 'desktop' ? t('pageSettings.addPasskeyTitle') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
					>
						<div className="flex items-center">
							<Icon size={20} />
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
								<h3 className="text-2xl mt-4 mb-2 font-bold text-primary dark:text-white">{t('registerPasskey.messageSuccess')}</h3>
								<p className="mb-2 dark:text-white">{t('registerPasskey.giveNickname')}</p>
								<input
									type="text"
									className="border border-gray-300 dark:border-gray-500 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride py-1.5 px-3"
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
							variant="cancel"
							disabled={isSubmitting}
						>
							{t('common.cancel')}
						</Button>

						{pendingCredential && (
							<Button
								id="save-add-passkey-settings"
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
				open={resolvePrfRetryPrompt && !prfRetryAccepted}
				onCancel={() => resolvePrfRetryPrompt(false)}
			>
				<h3 className="text-2xl mt-4 mb-2 font-bold text-primary dark:text-white">{t('registerPasskey.messageDone')}</h3>
				<p className='dark:text-white'>{t('registerPasskey.passkeyCreated')}</p>
				<p className='dark:text-white'>{t('registerPasskey.authOnceMore')}</p>

				<div className='flex justify-center gap-2'>
					<Button
						id="cancel-prf-passkey-settings"
						onClick={() => resolvePrfRetryPrompt(false)}
						variant="cancel"
					>
						{t('common.cancel')}
					</Button>

					<Button
						id="continue-prf-passkey-settings"
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
					<Button
						id="cancel-in-progress-prf-settings"
						variant="cancel"
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
				id={`${unlocked ? 'lock-passkey' : 'unlock-passkey'}-management-settings`}
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
							id="cancel-password-management-settings"
							type="button"
							className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer font-medium rounded-lg text-sm hover:bg-gray-100 mr-2"
							onClick={onCancelPassword}
							disabled={isSubmittingPassword}
						>
							{t('common.cancel')}
						</button>

						<button
							id="submit-password-management-settings"
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
						id="upgrade-prf-settings"
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
								id="cancel-editing-settings"
								onClick={onCancelEditing}
								variant="cancel"
								disabled={submitting}
								ariaLabel={t('pageSettings.passkeyItem.cancelChangesAriaLabel', { passkeyLabel: currentLabel })}
							>
								{t('common.cancel')}
							</Button>
							<Button
								id="save-editing-settings"
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
							id="rename-passkey"
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
						id="delete-passkey"
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
	const { setColorScheme, settings } = useContext(AppSettingsContext);
	const [userData, setUserData] = useState<UserData>(null);
	const { webauthnCredentialCredentialId: loggedInPasskeyCredentialId } = api.getSession();
	const [unwrappingKey, setUnwrappingKey] = useState<CryptoKey | null>(null);
	const [wrappedMainKey, setWrappedMainKey] = useState<WrappedKeyInfo | null>(null);
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
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
			const [{ }, newPrivateData, keystoreCommit] = await keystore.alterSettings({
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

	return (
		<>
			<div className="px-6 sm:px-12 w-full">
				{userData && (
					<>
						<H1 heading={t('common.navItemSettings')} />
						<PageDescription description={t('pageSettings.description')} />

						<div className="my-2 py-2">
							<H2 heading={t('pageSettings.title.language')} />
							<div className="relative inline-block min-w-36 text-gray-700">
								<div className="relative">
									<LanguageSelector className="h-10 pl-3 pr-10 border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride appearance-none" showName={true} />
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
								<Button
									id="color-scheme-light"
									onClick={() => setColorScheme('light')}
									variant='custom'
									ariaLabel={t('pageSettings.appearance.colorScheme.light')}
									title={t('pageSettings.appearance.colorScheme.light')}
									additionalClassName={`border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white ${settings.colorScheme === 'light' ? 'bg-gray-100 border border-primary dark:border-primary-light' : 'bg-white '}`}

								>
									<BsSunFill className='mr-2' />
									{t('pageSettings.appearance.colorScheme.light')}
								</Button>

								<Button
									id="color-scheme-dark"
									onClick={() => setColorScheme('dark')}
									variant="custom"
									ariaLabel={t('pageSettings.appearance.colorScheme.dark')}
									title={t('pageSettings.appearance.colorScheme.dark')}
									additionalClassName={`border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white ${settings.colorScheme === 'dark' ? 'dark:bg-gray-700 border border-primary dark:border-white' : 'bg-white dark:bg-gray-800'}`}

								>
									<BsMoonFill className='mr-2' />
									{t('pageSettings.appearance.colorScheme.dark')}
								</Button>

								<Button
									id="color-scheme-system"
									onClick={() => setColorScheme('system')}
									variant="custom"
									ariaLabel={t('pageSettings.appearance.colorScheme.system')}
									title={t('pageSettings.appearance.colorScheme.system')}
									additionalClassName={`border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white ${settings.colorScheme === 'system' ? 'bg-gray-100 dark:bg-gray-700 border border-primary dark:border-white' : 'bg-white  dark:bg-gray-800'}`}
								>
									{screenType === 'desktop' ? (
										<FaLaptop className='mr-2' />
									) : (
										<FaMobile className='mr-2' />
									)}
									{t('pageSettings.appearance.colorScheme.system')}
								</Button>
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
									<div className="relative">
										<select
											className={`h-10 pl-3 pr-10 border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride appearance-none`}
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
										<span className="absolute top-1/2 right-2 transform -translate-y-[43%] pointer-events-none">
											<IoIosArrowDown className='dark:text-white' />
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
									</H3>
									<WebauthnRegistation
										unwrappingKey={unwrappingKey}
										wrappedMainKey={wrappedMainKey}
										onSuccess={() => refreshData()}
									/>
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
										id="delete-account"
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
										values={{ react_app_version: import.meta.env.VITE_APP_VERSION }}
										components={{
											reloadButton:
												<button
													id="reload-update-version"
													className='text-primary dark:text-extra-light underline'
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
