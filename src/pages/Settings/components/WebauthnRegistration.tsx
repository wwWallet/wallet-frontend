import React, { useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import useScreenType from '../../../hooks/useScreenType';
import { withAuthenticatorAttachmentFromHints } from '@/util-webauthn';
import { serializePrivateData } from '../../../services/keystore';

import Button from '../../../components/Buttons/Button';
import { H2 } from '../../../components/Shared/Heading';
import { FingerprintIcon, KeyRound, SmartphoneNfcIcon } from 'lucide-react';
import Dialog from './Dialog';

const WebauthnRegistration = ({
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
			<span className="grow text-lm-gray-900 dark:text-white">{t('pageSettings.addPasskey')}</span>
			{
				[
					{ hint: "client-device", btnLabel: t('common.platformPasskey'), Icon: FingerprintIcon },
					{ hint: "security-key", btnLabel: t('common.externalPasskey'), Icon: KeyRound },
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
									className="my-4 w-full px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg inputDarkModeOverride"
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
				<H2 heading={t('registerPasskey.messageDone')} flexJustifyContent='center' hr={false} />
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

export default WebauthnRegistration;
