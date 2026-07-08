import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import { withAuthenticatorAttachmentFromHints } from '@/util-webauthn';
import { serializePrivateData } from '../../../services/keystore';

import Button from '../../../components/Buttons/Button';
import { H2 } from '../../../components/Shared/Heading';
import { ChevronDown, FingerprintIcon, KeyRound, LoaderCircle, Plus, ShieldCheck, SmartphoneNfcIcon } from 'lucide-react';
import Dialog from './Dialog';

const passkeyOptions = (t: (key: string) => string) => [
	{ hint: "client-device", btnLabel: t('common.platformPasskey'), Icon: FingerprintIcon },
	{ hint: "security-key", btnLabel: t('common.externalPasskey'), Icon: KeyRound },
	{ hint: "hybrid", btnLabel: t('common.hybridPasskey'), Icon: SmartphoneNfcIcon },
];

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
	const abortControllerRef = useRef<AbortController | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!menuOpen) return;
		const handler = (event: MouseEvent) => {
			if (menuRef.current?.contains(event.target as Node)) return;
			setMenuOpen(false);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [menuOpen]);

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
				const abortController = new AbortController();
				abortControllerRef.current = abortController;
				const createOptions = {
					...beginData.createOptions,
					signal: abortController.signal,
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
					if (e?.name !== 'AbortError') {
						console.error("Failed to register", e);
					}
					setBeginData(null);
					setPendingCredential(null);
				} finally {
					abortControllerRef.current = null;
				}
				setIsSubmitting(false);
			}
		},
		[api],
	);

	const onCancel = () => {
		console.log("onCancel");
		abortControllerRef.current?.abort();
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
		<div ref={menuRef} className="relative inline-block">
			<button
				id="add-passkey-trigger"
				type="button"
				onClick={() => setMenuOpen((open) => !open)}
				disabled={registrationInProgress || !isOnline}
				aria-haspopup="menu"
				aria-expanded={menuOpen}
				title={!isOnline ? t("common.offlineTitle") : t('pageSettings.addPasskeyTitle')}
				className={`rounded-lg shadow-xs text-center font-medium flex flex-row flex-nowrap items-center justify-center gap-2 border transition-color duration-150 text-sm px-4 py-2 text-lm-gray-900 dark:text-white bg-lm-gray-200 dark:bg-dm-gray-800 border-lm-gray-700 dark:border-dm-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 ${(registrationInProgress || !isOnline) ? 'grayscale opacity-75 cursor-not-allowed' : 'hover:cursor-pointer hover:brightness-[0.85] dark:hover:brightness-[1.15]'}`}
			>
				<Plus size={18} />
				{t('pageSettings.addPasskey').replace(/:$/, '')}
				<ChevronDown size={16} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
			</button>

			{menuOpen && (
				<div
					role="menu"
					aria-label={t('pageSettings.addPasskeyTitle')}
					className="absolute left-0 mt-2 min-w-56 border border-lm-gray-400 dark:border-dm-gray-600 bg-lm-gray-100 dark:bg-dm-gray-900 rounded-lg shadow-lg z-50 p-1"
				>
					{passkeyOptions(t).map(({ Icon, hint, btnLabel }) => (
						<button
							key={hint}
							id={`add-passkey-settings-${hint}`}
							role="menuitem"
							type="button"
							className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left cursor-pointer text-lm-gray-900 dark:text-white hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600"
							onClick={() => {
								setMenuOpen(false);
								onBegin(hint);
							}}
						>
							<Icon size={18} />
							{btnLabel}
						</button>
					))}
				</div>
			)}

			<Dialog
				open={stateChooseNickname}
				onCancel={onCancel}
			>
				<form onSubmit={onFinish}>
					{pendingCredential
						? (
							<>
								<H2
									heading={t('registerPasskey.messageSuccess')}
									hr={false}
									flexJustifyContent='center'
								/>
								<p className="mb-2 text-lm-gray-800 dark:text-dm-gray-200">{t('registerPasskey.giveNickname')}</p>
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
							<div className="flex flex-col items-center gap-3 py-2">
								<LoaderCircle size={28} className="animate-spin text-lm-gray-500 dark:text-dm-gray-400" />
								<p className="text-lm-gray-800 dark:text-dm-gray-200">{t('registerPasskey.messageInteract')}</p>
							</div>
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
				<H2
					heading={(
						<span className="flex items-center justify-center gap-2">
							<ShieldCheck size={20} className="text-lm-gray-700 dark:text-dm-gray-300" />
							{t('registerPasskey.messageDone')}
						</span>
					)}
					flexJustifyContent='center'
					hr={false}
				/>
				<p className='text-lm-gray-800 dark:text-dm-gray-200'>{t('registerPasskey.passkeyCreated')}</p>
				<p className='text-lm-gray-800 dark:text-dm-gray-200'>{t('registerPasskey.authOnceMore')}</p>

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
				<div className="flex flex-col items-center gap-3 py-2">
					<LoaderCircle size={28} className="animate-spin text-lm-gray-500 dark:text-dm-gray-400" />
					<p className="text-lm-gray-800 dark:text-dm-gray-200">{t('registerPasskey.messageInteractNewPasskey')}</p>
				</div>
				<div className='flex justify-center mt-2'>
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
