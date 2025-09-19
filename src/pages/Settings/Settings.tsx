import React, { FormEvent, KeyboardEvent, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
import type { WebauthnPrfEncryptionKeyInfo, WrappedKeyInfo } from '../../services/keystore';
import { isPrfKeyV2, serializePrivateData } from '../../services/keystore';

import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
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
	ensureUnlocked,
	size = 'lg',
	disabled = false,
	additionalClassName = '',
	short = false,
	dropdownMode = false,
}: {
	unwrappingKey?: CryptoKey,
	onSuccess: () => void,
	wrappedMainKey?: WrappedKeyInfo,
	ensureUnlocked: () => Promise<boolean>,
	size?: 'lg' | 'md' | 'sm',
	disabled?: boolean,
	additionalClassName?: string,
	short?: boolean,
	dropdownMode?: boolean,
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
	const [showDropdown, setShowDropdown] = useState(false);
	const { t } = useTranslation();
	const unlocked = Boolean(unwrappingKey && wrappedMainKey);
	const screenType = useScreenType();
	const dropdownRef = useRef<HTMLDivElement>(null);

	const stateChooseNickname = Boolean(beginData) && !needPrfRetry;

	const onBegin = useCallback(
		async (webauthnHint) => {
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
		[api, ensureUnlocked],
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

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setShowDropdown(false);
			}
		};

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showDropdown]);

	const passkeyOptions = [
		{ hint: "client-device", btnLabel: t('common.platformPasskey'), Icon: GoPasskeyFill },
		{ hint: "security-key", btnLabel: t('common.externalPasskey'), Icon: GoKey },
		{ hint: "hybrid", btnLabel: t('common.hybridPasskey'), Icon: GoDeviceMobile },
	];

	const handleDropdownOptionClick = (hint: string) => {
		setShowDropdown(false);
		onBegin(hint);
	};

	return (
		<>
			{dropdownMode ? (
				<div className="relative" ref={dropdownRef}>
					<Button
						id="add-passkey-dropdown-settings"
						onClick={() => setShowDropdown(!showDropdown)}
						variant="primary"
						disabled={registrationInProgress || !isOnline || disabled}
						ariaLabel={!isOnline ? t("common.offlineTitle") : t('pageSettings.addPasskey')}
						title={!isOnline ? t("common.offlineTitle") : t('pageSettings.addPasskeyTitle')}
						additionalClassName={additionalClassName}
					>
						<div className="flex items-center">
							<FaEdit size={16} />
							<span className={`block ml-2 mr-1`}>
								{t('pageSettings.addPasskeyButton')}
							</span>
							<IoIosArrowDown size={16} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
						</div>
					</Button>

					{showDropdown && (
						<div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 text-sm">
							<div className="py-2">
								{passkeyOptions.map(({ Icon, hint, btnLabel }) => (
									<button
										key={hint}
										onClick={() => handleDropdownOptionClick(hint)}
										className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-150"
										disabled={registrationInProgress}
									>
										<Icon size={20} className="mr-3" />
										<span>{btnLabel}</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			) : (
				passkeyOptions.map(({ Icon, hint, btnLabel }) => (
					<Button
						key={hint}
						id={`add-passkey-settings-${hint}`}
						onClick={() => onBegin(hint)}
						variant="primary"
						disabled={registrationInProgress || !isOnline || disabled}
						ariaLabel={!isOnline ? t("common.offlineTitle") : (screenType !== 'desktop' ? t('pageSettings.addPasskey') : "")}
						title={!isOnline ? t("common.offlineTitle") : (screenType !== 'desktop' ? t('pageSettings.addPasskeyTitle') : "")}
						additionalClassName={additionalClassName}
					>
						<div className="flex items-center">
							<Icon size={20} />
							<span className={`block ml-2`}>
								{short ? t('pageSettings.addPasskey') : btnLabel}
							</span>
						</div>
					</Button>
				))
			)}

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
				open={needPrfRetry && !prfRetryAccepted}
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
	unlocked,
	additionalClassName = '',
}: {
	credential: WebauthnCredential,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
	onDelete?: false | (() => Promise<void>),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
	onUpgradePrfKey: (prfKeyInfo: WebauthnPrfEncryptionKeyInfo) => void,
	unlocked: boolean,
	additionalClassName?: string,
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
			className={`mt-4 rounded-lg border border-gray-300 dark:border-gray-600 overflow-x-auto ${additionalClassName}`}
			onSubmit={onSubmit}
		>
			<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
				<H2 heading={t('pageSettings.passkeyItem.title')} />

				<div className="items-start flex inline-flex">
					{needsPrfUpgrade &&
						<Button
							id="upgrade-prf-settings"
							onClick={() => onUpgradePrfKey(prfKeyInfo)}
							ariaLabel={t('pageSettings.passkeyItem.prfUpgradeAriaLabel', { passkeyLabel: currentLabel })}
							variant="secondary"
							additionalClassName="mr-2"
						>
							<FaSyncAlt size={16} className="mr-2" />
							{t('pageSettings.passkeyItem.prfUpgrade')}
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
									variant="cancel"
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
								disabled={(onDelete && !unlocked) || !isOnline}
								aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
								title={!isOnline ? t("common.offlineTitle") : onDelete && !unlocked && t("pageSettings.passkeyItem.renameButtonTitleLocked")}
								variant="secondary"
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
			</div>

			<div className="p-4 sm:p-6 flex flex-col grow">
				<div className="flex flex-col sm:flex-row sm:items-center">
					<p className="flex-1 text-gray-700 dark:text-gray-300">
						{t('pageSettings.passkeyItem.nickname')}
					</p>

					<div className="flex-5 flex items-center mt-2 sm:mt-0 relative">
						<p className={`text-gray-900 dark:text-white ${editing ? 'opacity-0' : ''}`}>
							{currentLabel}
						</p>

						{editing &&
							<input
								className="absolute -left-[13px] sm:left-auto sm:right-0 min-w-64 max-w-64 w-full border rounded-lg py-1.5 px-3 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white dark:inputDarkModeOverride outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
								type="text"
								placeholder={t('pageSettings.passkeyItem.nicknameInput')}
								value={nickname}
								onChange={(event) => setNickname(event.target.value)}
								aria-label={t('pageSettings.passkeyItem.nicknameInputAriaLabel', { passkeyLabel: currentLabel })}
								onKeyUp={onKeyUp}
								disabled={submitting}
								autoFocus
							/>
						}
					</div>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center mt-4">
					<p className="flex-1 text-gray-700 dark:text-gray-300">
						{t('pageSettings.passkeyItem.created')}
					</p>

					<p className="flex-5 text-gray-900 dark:text-white mt-2 sm:mt-0">
						{formatDate(credential.createTime)}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center mt-4">
					<p className="flex-1 text-gray-700 dark:text-gray-300">
						{t('pageSettings.passkeyItem.lastUsed')}
					</p>

					<p className="flex-5 text-gray-900 dark:text-white mt-2 sm:mt-0">
						{formatDate(credential.lastUseTime)}
					</p>
				</div>

				<div className="flex flex-col sm:flex-row sm:items-center mt-4">
					<p className="flex-1 text-gray-700 dark:text-gray-300">
						{t('pageSettings.passkeyItem.canEncrypt')}
					</p>

					<p className="flex-5 text-gray-900 dark:text-white mt-2 sm:mt-0">
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

	// New state for improved unlock management
	const [password, setPassword] = useState('');
	const [unlockError, setUnlockError] = useState('');
	const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
	const [isPromptingForPassword, setIsPromptingForPassword] = useState(false);
	const [resolvePasswordPromise, setResolvePasswordPromise] = useState<((password: string | null) => void) | null>(null);

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

	// New ensureUnlocked function
	const ensureUnlocked = useCallback(async () => {
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
					setUnlockError('An error occurred'); 
					break;
			}
			setUnwrappingKey(null); // Ensure state reflects locked status on error
			setWrappedMainKey(null);
			return false;
		} finally {
			setIsSubmittingPassword(false); // Ensure this is reset
		}
	}, [unlocked, keystore, t]);

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
		<div className="px-6 sm:px-12 w-full">
			{userData && (
				<>
					<H1 heading={t('common.navItemSettings')} />
					<PageDescription description={t('pageSettings.description')} />

					{/* Preferences Section */}
					<div className="mt-11 rounded-lg border border-gray-300 dark:border-gray-600">
						<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
							<H2 heading={t('pageSettings.title.preferences') || 'Preferences'} />
						</div>

						<div className="p-4 sm:p-6 space-y-6">
							<div>
								<p className='mb-4 text-gray-700 dark:text-gray-300'>
									{t('pageSettings.language.description')}
								</p>
								<div className="mt-2 flex">
									<LanguageSelector className="h-10 pl-3 pr-10 border border-gray-300 dark:border-gray-500 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride appearance-none" showName={true} />
								</div>
							</div>

							<div>
								<p className='mb-4 text-gray-700 dark:text-gray-300'>
									{t('pageSettings.appearance.colorScheme.description')}
								</p>
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
						</div>
					</div>

					{/* Remember Issuer Section */}
					<div className="mt-8 rounded-lg border border-gray-300 dark:border-gray-600">
						<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
							<H2 heading={t('pageSettings.title.rememberIssuer')} />
						</div>

						<div className="p-4 sm:p-6">
							<p className='mb-4 text-gray-700 dark:text-gray-300'>
								{t('pageSettings.rememberIssuer.description')}
							</p>
							<div className='flex gap-4 items-center'>
								<div className="relative inline-block min-w-36 text-gray-700">
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
								{successMessage && (
									<div className="text-green-500">
										{successMessage}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Logged In Passkey Section */}
					{loggedInPasskey && (
						<WebauthnCredentialItem
							key={loggedInPasskey.id}
							credential={loggedInPasskey}
							prfKeyInfo={keystore.getPrfKeyInfo(loggedInPasskey.credentialId)}
							onRename={onRenameWebauthnCredential}
							onUpgradePrfKey={onUpgradePrfKey}
							unlocked={unlocked}
							additionalClassName='mt-8'
						/>
					)}

					{/* Other Passkeys Section */}
					<div className="mt-8 rounded-lg border border-gray-300 dark:border-gray-600">
						<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
							<H2 heading={t('pageSettings.title.manageOtherPasskeys')} />
							{userData.webauthnCredentials.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length > 0 && (
								<WebauthnRegistation
									unwrappingKey={unwrappingKey}
									wrappedMainKey={wrappedMainKey}
									onSuccess={refreshData}
									ensureUnlocked={ensureUnlocked}
									size='md'
									short={screenType !== 'desktop'}
									dropdownMode={true}
								/>
							)}
						</div>

						{userData.webauthnCredentials.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length <= 0 ? (
							<div className="px-4 sm:px-6 py-24 flex flex-col items-center text-center">
								<H3 heading={t('pageSettings.noOtherPasskeysTitle') || 'No other passkeys'} />
								<p className="text-gray-700 dark:text-gray-300 max-w-lg mt-4">
									{t('pageSettings.noOtherPasskeysDescription') || 'Add additional passkeys to secure your account and provide backup access options.'}
								</p>
								<div className="mt-6 flex flex-col">
									<WebauthnRegistation
										unwrappingKey={unwrappingKey}
										wrappedMainKey={wrappedMainKey}
										onSuccess={refreshData}
										ensureUnlocked={ensureUnlocked}
										size='lg'
										additionalClassName='mt-2'
									/>
								</div>
							</div>
						) : (
							<div className="p-4 sm:p-6">
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
							</div>
						)}
					</div>

					{/* Delete Account Section */}
					<div className="mt-8 rounded-lg border border-gray-300 dark:border-gray-600">
						<div className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-300 dark:border-gray-600">
							<H2 heading={t('pageSettings.deleteAccount.title')} />
						</div>

						<div className="p-4 sm:p-6">
							<p className='mb-4 text-gray-700 dark:text-gray-300'>
								{t('pageSettings.deleteAccount.description')}
							</p>
							<Button
								id="delete-account"
								onClick={async () => {
									const isUnlocked = await ensureUnlocked();
									if (isUnlocked) {
										openDeleteConfirmation();
									}
								}}
								variant="delete"
								disabled={!isOnline}
								title={!isOnline ? t("common.offlineTitle") : ""}
							>
								{t('pageSettings.deleteAccount.buttonText')}
							</Button>
						</div>
					</div>

					{/* App Version Section */}
					<div className="relative flex flex-col items-center justify-center mt-20 px-4">
						{updateAvailable && (
							<div className='mb-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center h-12 w-12'>
								<MdNotifications size={22} className="text-green-600 dark:text-green-400" />
							</div>
						)}

						{updateAvailable ? (
							<p className='text-gray-700 dark:text-gray-300 text-center'>
								<Trans
									i18nKey="pageSettings.appVersion.descriptionOldVersion"
									values={{ react_app_version: import.meta.env.VITE_APP_VERSION }}
									components={{
										reloadButton:
											<button
												id="reload-update-version"
												className='text-primary dark:text-primary-light underline hover:no-underline'
												onClick={() => window.location.reload()}
											/>,
										strong: <strong />,
										br: <br />,
									}}
								/>
							</p>
						) : (
							<p className='text-gray-700 dark:text-gray-300 text-center'>
								{t('pageSettings.appVersion.descriptionLatestVersion', { react_app_version: import.meta.env.VITE_APP_VERSION })}
							</p>
						)}
					</div>
				</>
			)}

			{/* Dialogs */}
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
						<h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t('pageSettings.upgradePrfKey.title')}</h3>
						<p className='text-gray-700 dark:text-gray-300 mb-6'>
							{t('pageSettings.upgradePrfKey.description', { passkeyLabel: upgradePrfPasskeyLabel })}
						</p>
						<div className='flex justify-center gap-2'>
							<Button
								onClick={onCancelUpgradePrfKey}
								variant="cancel"
							>
								{t('common.cancel')}
							</Button>
						</div>
					</>
					: <>
						<h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{t('pageSettings.upgradePrfKey.title')}</h3>
						<Trans
							i18nKey="pageSettings.upgradePrfKey.error"
							values={{ passkeyLabel: upgradePrfPasskeyLabel }}
							components={{ p: <p className='text-gray-700 dark:text-gray-300 mb-4' /> }}
						/>
						<div className='flex justify-center gap-2'>
							<Button
								onClick={onCancelUpgradePrfKey}
								variant="cancel"
							>
								{t('common.cancel')}
							</Button>
							<Button
								onClick={() => onUpgradePrfKey(upgradePrfState.prfKeyInfo)}
								variant="secondary"
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
					<h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
						{t('pageSettings.unlockPassword.title')}
					</h3>

					<p className="text-gray-700 dark:text-gray-300 mb-6">
						{t('pageSettings.unlockPassword.description')}
					</p>
					
					<input
						type="password"
						className="w-full border rounded-lg py-2 px-3 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-500 text-gray-900 dark:text-white dark:inputDarkModeOverride outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
							onClick={onCancelPassword}
							disabled={isSubmittingPassword}
						>
							{t('common.cancel')}
						</Button>

						<Button	
							id="submit-password-management-settings"
							type="submit"
							variant="secondary"
							disabled={isSubmittingPassword}
						>
							{t('common.submit')}
						</Button>
					</div>

					{unlockError && (
						<p className="text-red-500 mt-4 text-center">
							{unlockError}
						</p>
					)}
				</form>
			</Dialog>
		</div>
	);
};

export default Settings;
