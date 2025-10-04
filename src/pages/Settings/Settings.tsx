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
import { byteArrayEquals, compareBy, toBase64Url } from '../../util';
import { withAuthenticatorAttachmentFromHints } from '@/util-webauthn';
import { formatDate } from '../../functions/DateFormat';
import type { PrecreatedPublicKeyCredential, WebauthnPrfEncryptionKeyInfo, WebauthnSignArkgPublicSeed, WebauthnSignSplitBbsKeypair } from '../../services/keystore';
import { isPrfKeyV2, serializePrivateData } from '../../services/keystore';

import Button from '../../components/Buttons/Button';
import DeletePopup from '../../components/Popups/DeletePopup';
import Dialog from '../../components/Dialog';
import { H1, H2, H3 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { GoDeviceMobile, GoKey, GoPasskeyFill } from 'react-icons/go';
import { FaLaptop, FaMobile } from "react-icons/fa";
import { PrivacyLevelIcon } from '@/components/PrivacyLevelIcon';
import { BiPlus } from 'react-icons/bi';
import { COSE_ALG_ESP256_ARKG, COSE_ALG_SPLIT_BBS } from 'wallet-common/dist/cose';
import WebauthnInteractionDialogContext from '@/context/WebauthnInteractionDialogContext';
import { TbDeviceUsb } from 'react-icons/tb';
import { MaybeNamed } from '@/services/WalletStateSchemaVersion3';
import { parseJwp } from 'wallet-common/dist/jwp';


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
	onSuccess,
}: {
	onSuccess: () => void,
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

		if (beginData && pendingCredential) {
			try {
				const [newPrivateData, keystoreCommit] = await keystore.finishAddPrf(
					pendingCredential,
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
			console.error("Invalid state:", beginData, pendingCredential);
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
								<p className='dark:text-white'>{t('webauthn.messageInteract')}</p>
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
							<BsUnlock size={20} />
							<span className='hidden md:block ml-2'>
								{t('pageSettings.lockSensitive')}
							</span>
						</>
						: <>
							<BsLock size={20} />
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
	const credIdB64 = toBase64Url(credential.credentialId);

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
							disabled={!isOnline}
							aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
							title={!isOnline ? t("common.offlineTitle") : ""}
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
						disabled={!isOnline}
						aria-label={t('pageSettings.passkeyItem.deleteAriaLabel', { passkeyLabel: currentLabel })}
						title={!isOnline ? t("common.offlineTitle") : t("pageSettings.passkeyItem.deleteButtonTitleUnlocked", { passkeyLabel: currentLabel })}
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

	const [registerWebauthnSigningKeyInProgress, setRegisterWebauthnSigningKeyInProgress] = useState(false);

	const webauthnInteractionCtx = useContext(WebauthnInteractionDialogContext);
	const walletState = keystore.getCalculatedWalletState();

	const hasHardwareArkg = walletState.arkgSeeds.length > 0;
	const hasHardwareBbs = walletState.splitBbsKeypairs.length > 0;
	function findCredential(credentialId?: BufferSource): WebauthnCredential | undefined {
		return credentialId
			? userData?.webauthnCredentials?.find(cred => byteArrayEquals(cred.credentialId, credentialId))
			: undefined;
	}
	function useHardwareKeyNickname(hardwareKey?: MaybeNamed<WebauthnSignArkgPublicSeed | WebauthnSignSplitBbsKeypair>): string {
		const parentNickname = useWebauthnCredentialNickname(findCredential(hardwareKey?.credentialId));
		return hardwareKey?.name ?? parentNickname;
	}
	const hardwareArkgName = useHardwareKeyNickname(walletState.arkgSeeds[0]);
	const hardwareBbsName = useHardwareKeyNickname(walletState.splitBbsKeypairs[0]);
	const hardwareArkgUses = hasHardwareArkg
		? walletState.credentials.filter(cred => {
			const keypair = walletState.keypairs.find(kp => kp.kid === cred.kid)?.keypair;
			return keypair
				&& "externalPrivateKey" in keypair
				&& byteArrayEquals(keypair.externalPrivateKey.credentialId, walletState.arkgSeeds[0].credentialId);
		}).length
		: 0;
	const hardwareBbsUses = hasHardwareBbs
		? walletState.credentials.filter(cred => {
			try {
				if (cred.format === "dc+jpt") {
					const { proof: [, dpk] } = parseJwp(cred.data);
					if (dpk) {
						const kid = JSON.parse(new TextDecoder().decode(dpk))?.kid;
						const keypair = walletState.keypairs.find(kp => kp.kid === kid)?.keypair;
						return keypair
							&& "externalPrivateKey" in keypair
							&& byteArrayEquals(keypair.externalPrivateKey.credentialId, walletState.splitBbsKeypairs[0].credentialId);
					}
				}
				return false;
			} catch (e) {
				return false;
			}
		}).length
		: 0;

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

	const onRegisterWebauthnSigningKey = async (alg: number) => {
		try {
			setRegisterWebauthnSigningKeyInProgress(true);

			async function webauthnRegisterRetryLoop(
				heading: React.ReactNode,
				options: CredentialCreationOptions,
			): Promise<{ credential: PublicKeyCredential, name: string }> {
				const webauthnDialog = webauthnInteractionCtx.setup({ heading });

				let retry = true;
				while (retry) {
					try {
						const credential = await webauthnDialog.beginCreate(options, {
							bodyText: t('registerHardwareKey.intro'),
						});
						const name = await webauthnDialog.input({
							bodyText: t('registerHardwareKey.successGiveName'),
							input: {
								ariaLabel: t('registerHardwareKey.nicknameAriaLabel'),
								autoFocus: true,
								placeholder: t('registerHardwareKey.nicknamePlaceholder'),
							},
						});
						webauthnDialog.success({
							bodyText: t('registerHardwareKey.success'),
						});
						return { credential, name };

					} catch (e) {
						switch (e.cause?.id) {
							case 'key-not-found': {
								const result = await webauthnDialog.error({
									bodyText: t('registerHardwareKey.errorKeyNotFound'),
									buttons: {
										retry: true,
									},
								});
								retry = result.retry;
							}

							case 'user-abort':
								throw e;

							case 'err':
							default: {
								const result = await webauthnDialog.error({
									bodyText: t('registerHardwareKey.errorUnknown'),
									buttons: {
										retry: true,
									},
								});
								retry = result.retry;
								break;
							}
						}
					}
				}
			}

			const [newKeypair, newPrivateData, keystoreCommit] = await keystore.registerWebauthnSignKeypair(alg, async options => {
				return await webauthnRegisterRetryLoop(t('registerHardwareKey.heading'), options);
			});
			if (newKeypair) {
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
			}

		} finally {
			setRegisterWebauthnSigningKeyInProgress(false);
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
									<H3 heading={<>{t('pageSettings.hardwareKeys.heading')} <TbDeviceUsb className="inline" /></>} />
									<p className="mb-2">
										<Trans
											i18nKey="pageSettings.hardwareKeys.description"
											components={{ securityKeyIcon: <TbDeviceUsb className="inline" /> }}
										/>
									</p>
									<p className="mb-4">
										{t('pageSettings.hardwareKeys.onlyOne')}
									</p>
									<ul className="grid grid-cols-[max-content,max-content,max-content,max-content] gap-4">
										{[
											{
												key: 'high',
												Icon: PrivacyLevelIcon.High,
												active: hasHardwareBbs,
												label: t('pageSettings.hardwareKeys.labelHigh'),
												alg: COSE_ALG_SPLIT_BBS,
												name: hardwareBbsName,
												uses: hardwareBbsUses,
											},
											{
												key: 'medium',
												Icon: PrivacyLevelIcon.Medium,
												active: hasHardwareArkg,
												label: t('pageSettings.hardwareKeys.labelMedium'),
												alg: COSE_ALG_ESP256_ARKG,
												name: hardwareArkgName,
												uses: hardwareArkgUses,
											},
											{
												key: 'low',
												Icon: PrivacyLevelIcon.Low,
												active: hasHardwareArkg,
												label: t('pageSettings.hardwareKeys.labelLow'),
												alg: COSE_ALG_ESP256_ARKG,
												name: hardwareArkgName,
												uses: hardwareArkgUses,
											},
										].map(({ key, Icon, active, label, alg, name, uses }) =>
											<li key={key} className="grid grid-cols-subgrid col-span-full items-baseline">
												<Icon />
												<span>{label}</span>
												<span>
													{active
														? <>
															<TbDeviceUsb className="inline" />
															{' '}
															<Trans
																i18nKey="pageSettings.hardwareKeys.hardwareKeyDescription"
																components={{ strong: <strong /> }}
																values={{ name, count: uses }}
															/>
														</>
														: t('pageSettings.hardwareKeys.softwareKey')
													}
												</span>
												{!active &&
													<Button
														variant="primary"
														disabled={registerWebauthnSigningKeyInProgress}
														onClick={() => onRegisterWebauthnSigningKey(alg)}
													>
														<BiPlus /> {t('pageSettings.hardwareKeys.add')}
													</Button>}
											</li>
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
