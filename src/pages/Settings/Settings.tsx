import React, { FormEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { BsLock, BsPlusCircle, BsUnlock } from 'react-icons/bs';

import { useApi } from '../../api';
import { UserData, WebauthnCredential } from '../../api/types';
import { compareBy, jsonStringifyTaggedBinary, toBase64Url } from '../../util';
import { formatDate } from '../../functions/DateFormat';
import { WrappedKeyInfo, useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import DeletePopup from '../../components/Popups/DeletePopup';
import { useNavigate } from 'react-router-dom';
import GetButton from '../../components/Buttons/GetButton';

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
			style={{ minHeight: '30%', minWidth: '30%' }}
			onCancel={onCancel}
		>
			{children}
		</dialog>
	);
};

const WebauthnRegistation = ({
	existingPrfKey,
	onSuccess,
	wrappedMainKey,
}: {
	existingPrfKey?: CryptoKey,
	onSuccess: () => void,
	wrappedMainKey?: WrappedKeyInfo,
}) => {
	const api = useApi();
	const [beginData, setBeginData] = useState(null);
	const [pendingCredential, setPendingCredential] = useState(null);
	const [nickname, setNickname] = useState("");
	const [nicknameChosen, setNicknameChosen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<null | ((accept: boolean) => void)>(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const { t } = useTranslation();
	const keystore = useLocalStorageKeystore();
	const unlocked = Boolean(existingPrfKey && wrappedMainKey);

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
		setNicknameChosen(true);

		if (beginData && pendingCredential && existingPrfKey && wrappedMainKey) {
			try {
				const [newPrivateData, keystoreCommit] = await keystore.addPrf(
					pendingCredential,
					beginData.createOptions.publicKey.rp.id,
					existingPrfKey,
					wrappedMainKey,
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
				await api.post('/user/session/webauthn/register-finish', {
					challengeId: beginData.challengeId,
					nickname,
					credential: {
						type: pendingCredential.type,
						id: pendingCredential.id,
						rawId: pendingCredential.id,
						response: {
							attestationObject: toBase64Url(pendingCredential.response.attestationObject),
							clientDataJSON: toBase64Url(pendingCredential.response.clientDataJSON),
							transports: pendingCredential.response.getTransports(),
						},
						authenticatorAttachment: pendingCredential.authenticatorAttachment,
						clientExtensionResults: pendingCredential.getClientExtensionResults(),
					},
					privateData: jsonStringifyTaggedBinary(newPrivateData),
				});
				onSuccess();
				setNickname("");
				await keystoreCommit();

			} catch (e) {
				console.error("Failed to finish registration", e);

			} finally {
				onCancel();
			}
		} else {
			console.error("Invalid state:", beginData, pendingCredential, existingPrfKey, wrappedMainKey);
		}
	};

	const registrationInProgress = Boolean(beginData || pendingCredential);

	return (
		<>
			<GetButton
				content={
					<div className="flex items-center">
						<BsPlusCircle size={20} />
						<span className='hidden md:block ml-2'>
							{t('pageSettings.addPasskey')}
						</span>
					</div>
				}
				onClick={onBegin}
				variant="primary"
				disabled={registrationInProgress || !unlocked}
				// title={!unlocked ? t("pageSettings.deletePasskeyButtonTitleLocked") : ""}

				ariaLabel={unlocked ? (window.innerWidth < 768 ? t('pageSettings.addPasskey') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
				title={unlocked ? (window.innerWidth < 768 ? t('pageSettings.addPasskeyTitle') : "") : t("pageSettings.deletePasskeyButtonTitleLocked")}
			/>

			<Dialog
				open={stateChooseNickname}
				onCancel={onCancel}
			>
				<form method="dialog" onSubmit={onFinish}>
					{pendingCredential
						? (
							<>
								<h3 className="text-2xl mt-4 mb-2 font-bold text-primary">{t('pageSettings.registerPasskey.messageSuccess')}</h3>
								<p className="mb-2">{t('pageSettings.registerPasskey.giveNickname')}</p>
								<input
									type="text"
									className="border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3"
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
								<p>{t('pageSettings.registerPasskey.messageInteract')}</p>
							</>
						)
					}

					<div className="pt-2 flex justify-center gap-2">
						<GetButton
							content={t('common.cancel')}
							onClick={onCancel}
							variant="cancel"
							disabled={isSubmitting}
						/>

						{pendingCredential && (
							<GetButton
								type="submit"
								content={t('common.save')}
								variant="primary-light"
								disabled={isSubmitting}
							/>
						)}
					</div>

				</form>
			</Dialog>

			<Dialog
				open={needPrfRetry && !prfRetryAccepted}
				onCancel={() => resolvePrfRetryPrompt(false)}
			>
				<h3 className="text-2xl mt-4 mb-2 font-bold text-primary">{t('pageSettings.registerPasskey.messageDone')}</h3>
				<p>{t('pageSettings.registerPasskey.passkeyCreated')}</p>
				<p>{t('pageSettings.registerPasskey.authOnceMore')}</p>

				<div className='flex justify-center gap-2'>
					<GetButton
						content={t('common.cancel')}
						onClick={() => resolvePrfRetryPrompt(false)}
						variant="cancel"
					/>

					<GetButton
						content={t('common.continue')}
						onClick={() => resolvePrfRetryPrompt(true)}
						variant="primary-light"
						disabled={prfRetryAccepted}
					/>
				</div>

			</Dialog>

			<Dialog
				open={prfRetryAccepted}
				onCancel={onCancel}
			>
				<p>{t('pageSettings.registerPasskey.messageInteractNewPasskey')}</p>
				<div className='flex justify-center'>
					<GetButton
						content={t('common.cancel')}
						onClick={onCancel}
						variant="cancel"
					/>
				</div>
			</Dialog>
		</>
	);
};

const WebauthnUnlock = ({
	onLock,
	onUnlock,
	unlocked,
}: {
	onLock: () => void,
	onUnlock: (prfKey: CryptoKey, wrappedMainKey: WrappedKeyInfo) => void,
	unlocked: boolean,
}) => {
	const [inProgress, setInProgress] = useState(false);
	const [error, setError] = useState('');
	const keystore = useLocalStorageKeystore();
	const { t } = useTranslation();

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
				const [prfKey, keyInfo] = await keystore.getPrfKeyFromSession(async () => true);
				onUnlock(prfKey, keyInfo.mainKey);
			} catch (e) {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (e.errorId) {
					case 'passkeyInvalid':
						setError(t('passkeyInvalid'));
						break;

					case 'passkeyLoginFailedTryAgain':
						setError(t('passkeyLoginFailedTryAgain'));
						break;

					default:
						throw e;
				}
			} finally {
				setInProgress(false);
			}
		},
		[keystore, onUnlock, t],
	);

	return (
		<GetButton
			content={
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
			}
			onClick={unlocked ? onLock : onBeginUnlock}
			variant="primary"
			disabled={inProgress}
			ariaLabel={window.innerWidth < 768 ? (unlocked ? t('pageSettings.lockPasskeyManagement') : t('pageSettings.unlockPasskeyManagement')) : ""}
			title={window.innerWidth < 768 ? (unlocked ? t('pageSettings.lockPasskeyManagementTitle') : t('pageSettings.unlockPasskeyManagementTitle')) : ""}
		/>
	);
};

const WebauthnCredentialItem = ({
	credential,
	onDelete,
	onRename,
	unlocked

}: {
	credential: WebauthnCredential,
	onDelete?: false | (() => Promise<void>),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
	unlocked: boolean

}) => {
	const [nickname, setNickname] = useState(credential.nickname || '');
	const [editing, setEditing] = useState(false);
	const { t } = useTranslation();
	const currentLabel = credential.nickname || `${t('pageSettings.passkeyItem.unnamed')} ${credential.id.substring(0, 8)}`;
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

	const onKeyUp = useCallback(
		(event: KeyboardEvent<HTMLInputElement>) => {
			if (event.key === "Escape") {
				setNickname(credential.nickname || '');
				setEditing(false);
			}
		},
		[],
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

	return (
		<form
			className="mb-2 pl-4 bg-white px-4 py-2 border border-gray-300 rounded-md flex flex-row flex-wrap gap-y-2 overflow-x-auto"
			onSubmit={onSubmit}
		>
			<div className="grow">
				{editing
					? (
						<>
							<div className="flex items-center">
								<p className="font-semibold">
									{t('pageSettings.passkeyItem.nickname')}:&nbsp;
								</p>
								<input
									className="border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3 w-36"

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
								<span className="font-semibold">
									{t('pageSettings.passkeyItem.nickname')}:&nbsp;
								</span>
								<span className="font-bold text-primary">
									{currentLabel}
								</span>
							</p>
						</div>
					)
				}
				<p>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.created')}:&nbsp;
					</span>
					{formatDate(credential.createTime)}
				</p>
				<p>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.lastUsed')}:&nbsp;
					</span>
					{formatDate(credential.lastUseTime)}</p>
				<p>
					<span className="font-semibold">
						{t('pageSettings.passkeyItem.canEncrypt')}:&nbsp;
					</span>
					{credential.prfCapable ? t('pageSettings.passkeyItem.canEncryptYes') : t('pageSettings.passkeyItem.canEncryptNo')}</p>
			</div>

			<div className="items-start	 flex inline-flex">
				{editing
					? (

						<div className='flex gap-2'>
							<GetButton
								content={t('common.cancel')}
								onClick={() => setEditing(false)}
								variant="cancel"
								disabled={submitting}
								ariaLabel={t('pageSettings.passkeyItem.cancelChangesAriaLabel', { passkeyLabel: currentLabel })}
							/>
							<GetButton
								type="submit"
								content={t('common.save')}
								disabled={submitting}
								variant="primary-light"
							/>
						</div>
					)
					: (
						<GetButton
							content={
								<>
									<FaEdit size={16} className="mr-2" />
									{t('pageSettings.passkeyItem.rename')}
								</>
							}
							onClick={() => setEditing(true)}
							variant="primary-light"
							disabled={onDelete && !unlocked}
							aria-label={t('pageSettings.passkeyItem.renameAriaLabel', { passkeyLabel: currentLabel })}
							title={onDelete && !unlocked ? t("pageSettings.passkeyItem.renameButtonTitleLocked") : ""}
						/>
					)
				}

				{onDelete && (
					<GetButton
						content={<FaTrash size={16} />}
						onClick={openDeleteConfirmation}
						variant="delete"
						disabled={!unlocked}
						aria-label={t('pageSettings.passkeyItem.deleteAriaLabel', { passkeyLabel: currentLabel })}
						title={!unlocked ? t("pageSettings.passkeyItem.deleteButtonTitleLocked") : t("pageSettings.passkeyItem.deleteButtonTitleUnlocked", { passkeyLabel: currentLabel })}
						additionalClassName='ml-2 py-2.5'
					/>
				)}
				<DeletePopup
					isOpen={isDeleteConfirmationOpen}
					onConfirm={handleDelete}
					onCancel={closeDeleteConfirmation}
					message={
						<span>
							{t("pageSettings.passkeyItem.messageDeletePasskeyPart1")} <strong>{nickname}</strong> {t("pageSettings.passkeyItem.messageDeletePasskeyPart2")}
						</span>
					}
					loading={loading}
				/>
			</div>
		</form>
	);
};



const Settings = () => {
	const api = useApi();
	const [userData, setUserData] = useState<UserData>(null);
	const { webauthnCredentialCredentialId: loggedInPasskeyCredentialId } = api.getSession();
	const [existingPrfKey, setExistingPrfKey] = useState<CryptoKey | null>(null);
	const [wrappedMainKey, setWrappedMainKey] = useState<WrappedKeyInfo | null>(null);
	const unlocked = Boolean(existingPrfKey && wrappedMainKey);
	const showDelete = userData?.webauthnCredentials?.length > 1;
	const keystore = useLocalStorageKeystore();
	const { t } = useTranslation();
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => setIsDeleteConfirmationOpen(false);

	const deleteAccount = async () => {
		try {
			await api.del('/user/session');
			const cachedUser = keystore.getCachedUsers().filter((cachedUser) => cachedUser.displayName == userData.displayName)[0];
			if (cachedUser) {
				keystore.forgetCachedUser(cachedUser);
			}
			api.clearSession();
			await keystore.close();
			navigate('/login');
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
			try {
				const response = await api.get('/user/session/account-info');
				console.log(response.data);
				setUserData(response.data);
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
		const deleteResp = await api.post(`/user/session/webauthn/credential/${credential.id}/delete`, {
			privateData: jsonStringifyTaggedBinary(newPrivateData),
		});
		if (deleteResp.status === 204) {
			await keystoreCommit();
		} else {
			console.error("Failed to delete WebAuthn credential", deleteResp.status, deleteResp);
		}
		await refreshData();
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

	const loggedInPasskey = userData?.webauthnCredentials.find(
		cred => toBase64Url(cred.credentialId) === loggedInPasskeyCredentialId);

	return (
		<>
			<div className="sm:px-6 w-full">
				{userData && (
					<>
						<h1 className="text-2xl mb-2 font-bold text-primary">{t('common.navItemSettings')}</h1>
						<hr className="mb-2 border-t border-primary/80" />
						<p className="italic pd-2 text-gray-700">{t('pageSettings.description')}</p>

						<div className="my-2 py-2">
							<h1 className="text-lg mt-2 mb-2 font-bold text-primary">{t('pageSettings.title.loggedInPasskey')}</h1>
							<hr className="mb-2 border-t border-gray-700" />
							{loggedInPasskey && (
								<WebauthnCredentialItem
									key={loggedInPasskey.id}
									credential={loggedInPasskey}
									onRename={onRenameWebauthnCredential}
									unlocked={unlocked}
								/>
							)}
						</div>
						<div className="mt-2 mb-2 py-2">
							<div className="flex justify-between items-center">
								<h1 className="text-lg mt-2 mb-2 font-bold text-primary">{t('pageSettings.title.manageAcount')}</h1>
								<div className='flex'>
									<WebauthnUnlock
										unlocked={unlocked}
										onLock={() => {
											setExistingPrfKey(null);
											setWrappedMainKey(null);
										}}
										onUnlock={(prfKey, wrappedMainKey) => {
											setExistingPrfKey(prfKey);
											setWrappedMainKey(wrappedMainKey);
										}}
									/>
								</div>
							</div>
							<hr className="mb-2 border-t border-gray-500" />
							<div className='mb-2'>
								<div className="pt-4">
									<div className="flex justify-between items-center">
										<h1 className="font-semibold text-gray-700 my-2">{t('pageSettings.title.manageOtherPasskeys')}</h1>
										<div className='flex'>
											<WebauthnRegistation
												existingPrfKey={existingPrfKey}
												wrappedMainKey={wrappedMainKey}
												onSuccess={() => refreshData()}
											/>
										</div>
									</div>
									<hr className="mb-2 border-t border-gray-300" />
									<ul className="mt-4">

										{userData.webauthnCredentials
											.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id)
											.sort(compareBy((cred: WebauthnCredential) => new Date(cred.createTime)))
											.map(cred => (
												<WebauthnCredentialItem
													key={cred.id}
													credential={cred}
													onDelete={showDelete && (() => deleteWebauthnCredential(cred))}
													onRename={onRenameWebauthnCredential}
													unlocked={unlocked}
												/>
											))}
										{userData.webauthnCredentials
											.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id).length === 0 && (
												<p>{t('pageSettings.noOtherPasskeys')}</p>
											)}
									</ul>
								</div>

								<div className="pt-4">
									<h1 className="font-semibold text-gray-700 my-2">{t('pageSettings.deleteAccount.title')}</h1>
									<hr className="mb-2 border-t border-gray-300" />
									<p className='mb-2'>
										{t('pageSettings.deleteAccount.description')}
									</p>
									<GetButton
										content={t('pageSettings.deleteAccount.buttonText')}
										onClick={openDeleteConfirmation}
										variant="delete"
										disabled={!unlocked}
										title={!unlocked ? t("pageSettings.deleteAccount.deleteButtonTitleLocked") : ""}
									/>
								</div>
							</div>

						</div>
					</>
				)}
				<DeletePopup
					isOpen={isDeleteConfirmationOpen}
					onConfirm={handleDelete}
					onCancel={closeDeleteConfirmation}
					message={
						<span>
							{t('pageSettings.deleteAccount.messageDeleteAccount1')} <strong> {t('pageSettings.deleteAccount.messageDeleteAccount2')} </strong>?
						</span>
					}
					loading={loading}
				/>
			</div>
		</>
	);
};

export default Settings;
