import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import AppSettingsContext, { ColorScheme } from '@/context/AppSettingsContext';

import useScreenType from '../../hooks/useScreenType';

import { UserData, WebauthnCredential } from '../../api/types';
import { compareBy, toBase64Url } from '../../util';
import type { WebauthnPrfEncryptionKeyInfo } from '../../services/keystore';
import { serializePrivateData } from '../../services/keystore';

import DeletePopup from '../../components/Popups/DeletePopup';
import Button from '../../components/Buttons/Button';
import { H1, H2 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import { Bell, Clock, Info, KeyRound, Languages, Laptop, Moon, ShieldCheck, SlidersHorizontal, Smartphone, Sun, SunMoon, Trash2, UserCog } from 'lucide-react';
import { APP_VERSION } from '@/config';

import Dialog from './components/Dialog';
import SettingsSection from './components/SettingsSection';
import SettingsRow from './components/SettingsRow';
import SettingsSelect from './components/SettingsSelect';
import SettingsTabs, { SettingsTab } from './components/SettingsTabs';
import WebauthnRegistration from './components/WebauthnRegistration';
import WebauthnCredentialItem, { useWebauthnCredentialNickname } from './components/WebauthnCredentialItem';

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

const Settings = () => {
	const { isOnline, updateAvailable } = useContext(StatusContext);
	const { api, logout, keystore } = useContext(SessionContext);
	const { setColorScheme, settings } = useContext(AppSettingsContext);
	const [userData, setUserData] = useState<UserData>(null);
	const { webauthnCredentialCredentialId: loggedInPasskeyCredentialId } = api.getSession();
	const [unlocked, setUnlocked] = useState(false);
	const [unlockInProgress, setUnlockInProgress] = useState(false);
	const [unlockMainKeyError, setUnlockMainKeyError] = useState('');
	const showDelete = userData?.webauthnCredentials?.length > 1;
	const { t } = useTranslation();
	const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const screenType = useScreenType();

	const openDeleteConfirmation = () => setIsDeleteConfirmationOpen(true);
	const closeDeleteConfirmation = () => {
		setIsDeleteConfirmationOpen(false);
		setUnlocked(false);
	};
	const [upgradePrfState, setUpgradePrfState] = useState<UpgradePrfState | null>(null);
	const upgradePrfPasskeyLabel = useWebauthnCredentialNickname(upgradePrfState?.webauthnCredential);
	const [successMessage, setSuccessMessage] = useState('');
	const [obliviousSettingsMessage, setObliviousSettingsMessage] = useState('');
	const [activeTab, setActiveTab] = useState('general');

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

	const onDeleteAccountClick = useCallback(
		async () => {
			setUnlockMainKeyError('');
			setUnlockInProgress(true);
			try {
				await keystore.getPasswordOrPrfKeyFromSession(async () => true);
				setUnlocked(true);
				openDeleteConfirmation();
			} catch (e) {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (e?.cause?.errorId) {
					case 'passkeyInvalid':
						setUnlockMainKeyError(t('passkeyInvalid'));
						break;

					case 'passkeyLoginFailedTryAgain':
						setUnlockMainKeyError(t('passkeyLoginFailedTryAgain'));
						break;

					default:
						throw e;
				}
			} finally {
				setUnlockInProgress(false);
			}
		},
		[keystore, t],
	);

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

	const colorSchemeIcon = (
		settings.colorScheme === 'light' ? <Sun size={18} />
			: settings.colorScheme === 'dark' ? <Moon size={18} />
				: (screenType === 'desktop' ? <Laptop size={18} /> : <Smartphone size={18} />)
	);

	const tabs: SettingsTab[] = [
		{ id: 'general', label: t('pageSettings.title.general'), icon: <SlidersHorizontal size={16} /> },
		{ id: 'account', label: t('pageSettings.title.account'), icon: <UserCog size={16} /> },
		{ id: 'privacy', label: t('pageSettings.title.privacy'), icon: <ShieldCheck size={16} /> },
	];

	return (
		<>
			<div className="px-6 sm:px-12 w-full">
				{userData && (
					<>
						<H1 heading={t('common.navItemSettings')} />
						<PageDescription description={t('pageSettings.description')} />

						<div className="mt-4">
							<SettingsTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

							<div className="flex flex-col gap-5 mt-5">
								{activeTab === 'general' && (
									<>
										<SettingsSection title={t('pageSettings.title.language')} icon={<Languages size={18} />}>
											<SettingsRow description={t('pageSettings.language.description')}>
												<div className="relative inline-block min-w-36 [&_select]:cursor-pointer">
													<LanguageSelector className="h-10 pl-3 pr-10 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg inputDarkModeOverride appearance-none" showName={true} />
												</div>
											</SettingsRow>
										</SettingsSection>

										<SettingsSection title={t('pageSettings.appearance.title')} icon={<SunMoon size={18} />}>
											<SettingsRow
												title={t('pageSettings.appearance.colorScheme.title')}
												description={t('pageSettings.appearance.colorScheme.description')}
											>
												<SettingsSelect
													icon={colorSchemeIcon}
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
												</SettingsSelect>
											</SettingsRow>
										</SettingsSection>

										<SettingsSection
											title={t('pageSettings.title.appVersion')}
											icon={<Info size={18} />}
											actions={updateAvailable && (
												<Bell size={20} className="text-lm-green dark:text-dm-green" />
											)}
										>
											{updateAvailable ? (
												<p className='mb-2 text-sm text-lm-gray-800 dark:text-dm-gray-200'>
													<Trans
														i18nKey="pageSettings.appVersion.descriptionOldVersion"
														values={{ react_app_version: APP_VERSION }}
														components={{
															reloadButton:
																<button
																	id="reload-update-version"
																	className='text-primary dark:text-brand-light underline cursor-pointer'
																	onClick={() => window.location.reload()}
																/>,
															strong: <strong />,
															br: <br />,
														}}
													/>
												</p>
											) : (
												<p className='mb-2 text-sm text-lm-gray-800 dark:text-dm-gray-200'>
													{t('pageSettings.appVersion.descriptionLatestVersion', { react_app_version: APP_VERSION })}
												</p>
											)}
										</SettingsSection>
									</>
								)}

								{activeTab === 'privacy' && (
									<>
										<SettingsSection title={t('pageSettings.title.rememberIssuer')} icon={<Clock size={18} />}>
											<SettingsRow
												description={t('pageSettings.rememberIssuer.description')}
											>
												<div className='flex gap-2 items-center'>
													<SettingsSelect
														defaultValue={userData.settings.openidRefreshTokenMaxAgeInSeconds}
														onChange={(e) => handleTokenMaxAgeChange(e.target.value)}
													>
														<option value="0">{t('pageSettings.rememberIssuer.options.none')}</option>
														<option value="3600">{t('pageSettings.rememberIssuer.options.hour')}</option>
														<option value={`${24 * 3600}`}>{t('pageSettings.rememberIssuer.options.day')}</option>
														<option value={`${7 * 24 * 3600}`}>{t('pageSettings.rememberIssuer.options.week')}</option>
														<option value={`${30 * 24 * 3600}`}>{t('pageSettings.rememberIssuer.options.month')}</option>
													</SettingsSelect>
													{successMessage && (
														<div className="text-sm text-lm-green dark:text-dm-green whitespace-nowrap">
															{successMessage}
														</div>
													)}
												</div>
											</SettingsRow>
										</SettingsSection>

										<SettingsSection title={t('pageSettings.oblivious.title')} icon={<ShieldCheck size={18} />}>
											<SettingsRow
												description={t('pageSettings.oblivious.description')}
											>
												<div className='flex gap-2 items-center'>
													<SettingsSelect
														defaultValue={userData.settings.useOblivious}
														onChange={(e) => handleObliviousChange(e.target.value)}
														disabled={!isOnline}
														title={!isOnline ? t("common.offlineTitle") : undefined}
													>
														<option value="false">{t('pageSettings.oblivious.disabled')}</option>
														<option value="true">{t('pageSettings.oblivious.gunet')}</option>
													</SettingsSelect>
													{obliviousSettingsMessage && (
														<div className="text-sm text-lm-green dark:text-dm-green whitespace-nowrap">
															{obliviousSettingsMessage}
														</div>
													)}
												</div>
											</SettingsRow>
										</SettingsSection>
									</>
								)}

								{activeTab === 'account' && (
									<>
										<SettingsSection
											title={t('pageSettings.title.manageOtherPasskeys')}
											icon={<KeyRound size={18} />}
											actions={<WebauthnRegistration onSuccess={() => refreshData()} />}
											card={false}
										>
											<ul className="flex flex-col gap-3">
												{userData.webauthnCredentials
													.slice()
													.sort(compareBy((cred: WebauthnCredential) => new Date(cred.createTime)))
													.sort((a, b) => Number(b.id === loggedInPasskey?.id) - Number(a.id === loggedInPasskey?.id))
													.map(cred => (
														<WebauthnCredentialItem
															key={cred.id}
															credential={cred}
															prfKeyInfo={keystore.getPrfKeyInfo(cred.credentialId)}
															isCurrent={cred.id === loggedInPasskey?.id}
															onDelete={!(loggedInPasskey && cred.id === loggedInPasskey.id) && showDelete && (() => deleteWebauthnCredential(cred))}
															onRename={onRenameWebauthnCredential}
															onUpgradePrfKey={onUpgradePrfKey}
														/>
													))}
											</ul>
										</SettingsSection>

										<SettingsSection
											title={t('pageSettings.deleteAccount.title')}
											icon={<Trash2 size={18} />}
											variant="danger"
										>
											{unlockMainKeyError && <p className="mb-2 text-sm text-lm-red dark:text-dm-red">{unlockMainKeyError}</p>}
											<SettingsRow description={t('pageSettings.deleteAccount.description')}>
												<Button
													id="delete-account"
													onClick={onDeleteAccountClick}
													variant="delete"
													disabled={unlockInProgress || !isOnline}
													title={!isOnline ? t("common.offlineTitle") : ""}
												>
													<Trash2 size={18} />
													{t('pageSettings.deleteAccount.buttonText')}
												</Button>
											</SettingsRow>
										</SettingsSection>
									</>
								)}
							</div>
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
							<p className='mb-2 dark:text-white'>
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
								components={{ p: <p className='mb-2 dark:text-white' /> }}
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
