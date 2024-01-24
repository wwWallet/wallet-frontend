import React, { FormEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { BsLock, BsPlusCircle, BsUnlock } from 'react-icons/bs';

import { useApi } from '../../api';
import { UserData, WebauthnCredential } from '../../api/types';
import { compareBy, jsonStringifyTaggedBinary, toBase64Url } from '../../util';
import {formatDate} from '../../functions/DateFormat';
import { WrappedKeyInfo, useLocalStorageKeystore } from '../../services/LocalStorageKeystore';


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
			className="p-4 pt-8 text-center rounded"
			style={{ minHeight: '20em', minWidth: '30em' }}
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
			<button
				className={`px-2 py-2 mb-2 text-white ${unlocked ? "bg-custom-blue" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"} hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover`}
				onClick={onBegin}
				disabled={registrationInProgress || !unlocked}
			>
				<div className="flex items-center">
					<BsPlusCircle size={20} className="text-white mr-2 sm:inline" />
					{t('loginSignup.addPasskey')}
				</div>
			</button>

			<Dialog
				open={stateChooseNickname}
				onCancel={onCancel}
			>
				<form method="dialog" onSubmit={onFinish}>
					{pendingCredential
						? (
							<>
								<h3 className="text-2xl mt-4 mb-2 font-bold text-custom-blue">{t('pageSettings.manageOtherPasskey.messageSuccess')}</h3>
								<p className="mb-2">{t('pageSettings.manageOtherPasskey.giveNickname')}</p>
								<input
									type="text"
									className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
								<p>{t('pageSettings.manageOtherPasskey.messageiInteract')}</p>
							</>
						)
					}

					<div className="pt-2">
						<button
							type="button"
							className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer font-medium rounded-lg text-sm hover:bg-gray-100 mr-2"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							{t('common.cancel')}
						</button>

						{pendingCredential && (
							<button
								type="submit"
								className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								disabled={isSubmitting}
							>
							{t('common.save')}
							</button>
						)}
					</div>

				</form>
			</Dialog>

			<Dialog
				open={needPrfRetry && !prfRetryAccepted}
				onCancel={() => resolvePrfRetryPrompt(false)}
			>
				<h3 className="text-2xl mt-4 mb-2 font-bold text-custom-blue">{t('pageSettings.manageOtherPasskey.messageDone')}</h3>
				<p>{t('pageSettings.manageOtherPasskey.passkeyCreated')}</p>
				<p>{t('pageSettings.manageOtherPasskey.authOneMore')}</p>

				<button
					type="button"
					className="bg-white px-4 py-2 border border-gray-300 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100 mr-2"
					onClick={() => resolvePrfRetryPrompt(false)}
				>
					{t('common.cancel')}
				</button>
				<button
					type="button"
					className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					onClick={() => resolvePrfRetryPrompt(true)}
					disabled={prfRetryAccepted}
				>
					{t('common.continue')}
				</button>
			</Dialog>

			<Dialog
				open={prfRetryAccepted}
				onCancel={onCancel}
			>
				<p>{t('pageSettings.manageOtherPasskey.messageiInteractNewPasskey')}</p>

				<button
					type="button"
					className="bg-white px-4 py-2 border border-gray-300 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100 mr-2"
					onClick={onCancel}
				>
					{t('common.cancel')}
				</button>
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
		<button
			className="px-2 py-2 mr-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
			onClick={unlocked ? onLock : onBeginUnlock}
			disabled={inProgress}
		>
			<div className="flex items-center">
				{unlocked
					? <>
						<BsUnlock size={20} className="text-white mr-2 sm:inline" />
						{t('loginSignup.lockPasskeyManagement')}
					</>
					: <>
						<BsLock size={20} className="text-white mr-2 sm:inline" />
						{t('loginSignup.unlockPasskeyManagement')}
					</>
				}
			</div>
		</button>
	);
};

const WebauthnCredentialItem = ({
	credential,
	onDelete,
	onRename,
}: {
	credential: WebauthnCredential,
	onDelete?: false | (() => void),
	onRename: (credential: WebauthnCredential, nickname: string | null) => Promise<boolean>,
}) => {
	const [nickname, setNickname] = useState(credential.nickname || '');
	const [editing, setEditing] = useState(false);
	const { t } = useTranslation();
	const currentLabel = credential.nickname || `${t('pageSettings.loggedPasskey.unnamedPasskey')} ${credential.id.substring(0, 8)}`;
	const [submitting, setSubmitting] = useState(false);

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
			className="mb-2 pl-4 bg-white px-4 py-2 border border-gray-300 rounded-md flex flex-row flex-wrap gap-y-2"
			onSubmit={onSubmit}
		>
			<div className="grow">
				{editing
					? (
						<>
							<div className="flex items-center">
								<p className="font-bold">
									Nickname:&nbsp;	
								</p>
								<input
									className="shadow appearance-none border rounded-md w-80 p-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									type="text"
									placeholder={t('loginSignup.passkeyNicknameInput')}
									value={nickname}
									onChange={(event) => setNickname(event.target.value)}
									aria-label={t('loginSignup.passkeyNicknameInputAriaLabel', { passkeyLabel: currentLabel })}
									onKeyUp={onKeyUp}
									disabled={submitting}
								/>
							</div>
						</>
					)
					: (
						<div className="flex items-center">
							<p className="font-bold">
							{t('pageSettings.loggedPasskey.nickname')}:&nbsp;	
							</p>
							<p className="font-bold text-custom-blue">
								{currentLabel}
							</p>
						</div>
					)
				}
				<p> 
					<span className="font-semibold">
					{t('pageSettings.loggedPasskey.created')}:&nbsp;	
					</span>
					{formatDate(credential.createTime)}
					</p>
				<p>
					<span className="font-semibold">
					{t('pageSettings.loggedPasskey.lastUsed')}:&nbsp;	
					</span>
					{formatDate(credential.lastUseTime)}</p>
				<p>
					<span className="font-semibold">
						{t('pageSettings.loggedPasskey.canEncrypt')}:&nbsp;	
					</span>
					{credential.prfCapable ? "Yes" : "No"}</p>
			</div>

			<div className="items-start	 flex inline-flex">
				{editing
					? (
						<>
							<button
								className="bg-white px-4 py-2 border border-gray-300 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100 mr-2"
								type="button"
								disabled={submitting}
								onClick={() => setEditing(false)}
								aria-label={t('loginSignup.cancelPasskeyChangesAriaLabel', { passkeyLabel: currentLabel })}
							>
								{t('common.cancel')}
							</button>
							<button
								className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								type="submit"
								disabled={submitting}
								aria-label={t('loginSignup.savePasskeyChangesAriaLabel', { passkeyLabel: currentLabel })}
							>
								{t('loginSignup.save')}
							</button>
						</>
					)
					: (
						<>
							<button
								className="flex flex-row flex-nowrap items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								type="button"
								onClick={() => setEditing(true)}
								aria-label={t('loginSignup.renamePasskeyAriaLabel', { passkeyLabel: currentLabel })}
							>
								<FaEdit size={16} className="mr-2" /> {t('loginSignup.renamePasskey')}
							</button>
						</>
					)
				}

				{onDelete && (
					<button
						className="text-white bg-red-700 text-sm hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-800 ml-2 px-4 py-2"
						type="button"
						onClick={onDelete}
						aria-label={t('loginSignup.deletePasskeyAriaLabel', { passkeyLabel: currentLabel })}
					>
						<FaTrash size={16} />
					</button>
				)}
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
	const showDelete = unlocked && userData?.webauthnCredentials?.length > 1;
	const keystore = useLocalStorageKeystore();
	const { t } = useTranslation();

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
		refreshData();
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
						<h1 className="text-2xl mb-2 font-bold text-custom-blue">{t('common.navItemSettings')}</h1>
						<hr className="mb-2 border-t border-custom-blue/80" />
						<p className="italic pd-2 text-gray-700">{t('pageSettings.description')}</p>

						<div className="mt-2 mb-2 py-2">
							<h1 className="text-lg mt-2 mb-2 font-bold text-custom-blue">{t('pageSettings.loggedPasskey.title')}</h1>
							<hr className="mb-2 border-t border-gray-300" />
							{loggedInPasskey && (
								<WebauthnCredentialItem
									key={loggedInPasskey.id}
									credential={loggedInPasskey}
									onRename={onRenameWebauthnCredential}
								/>
							)}
						</div>
						<div className="mt-2 mb-2 py-2">
							<div className="flex justify-between items-center">
								<h1 className="text-lg mt-2 mb-2 font-bold text-custom-blue">{t('pageSettings.manageOtherPasskey.title')}</h1>
								<div>
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
									<WebauthnRegistation
										existingPrfKey={existingPrfKey}
										wrappedMainKey={wrappedMainKey}
										onSuccess={() => refreshData()}
									/>
								</div>
							</div>
							<hr className="mb-2 border-t border-gray-500" />

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
										/>
									))}
							</ul>
						</div>
					</>
				)}
			</div>
		</>
	);
};

export default Settings;
