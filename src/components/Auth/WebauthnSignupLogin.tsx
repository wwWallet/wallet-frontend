import React, { useContext, useEffect, useState, ChangeEventHandler } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import type { CachedUser } from '../../services/LocalStorageKeystore';
import { calculateByteSize, coerce } from '../../util';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import Button, { Variant } from '../../components/Buttons/Button';
import CachedUsersList from './CachedUsersList';
import SeparatorLine from '../Shared/SeparatorLine';

import checkForUpdates from '../../offlineUpdateSW';

import { Check, ChevronLeft, KeyRoundIcon, User, Wallet, X } from 'lucide-react';
import { UsbStickDotIcon } from '@/components/Shared/CustomIcons';
import PolicyLinks from '@/components/Shared/PolicyLinks';
import { usePolicyLinks } from '@/hooks/usePolicyLinks';

const FormInputRow = ({
	IconComponent,
	children,
	label,
	name,
}) => (
	<div className="mb-4 relative">
		<label className="block text-lm-gray-800 dark:text-dm-gray-200 text-sm font-bold mb-2" htmlFor={name}>
			<IconComponent size={20} className="absolute left-3 top-10 z-10 text-lm-gray-700 dark:text-dm-gray-300" />
			{label}
		</label>
		{children}
	</div>
);

const FormInputField = ({
	ariaLabel,
	disabled,
	name,
	onChange,
	placeholder,
	required,
	value,
	type,
}: {
	ariaLabel?: string,
	disabled?: boolean,
	name: string,
	onChange: ChangeEventHandler<HTMLInputElement>,
	placeholder?: string,
	required?: boolean,
	value: string,
	type?: 'text',
}) => {
	return (
		<div className="relative">
			<input
				className="w-full pl-10 pr-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 dark:text-white rounded-lg inputDarkModeOverride"
				type={type}
				name={name}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				aria-label={ariaLabel}
				required={required}
				disabled={disabled}
			/>
		</div>
	);
};

const WebauthnSignupLogin = ({
	isLogin,
	isSubmitting,
	setIsSubmitting,
	error,
	setError,
	setIsAwaitingRedirect,
	isAccountSwitcherOpen = false,
	setIsAccountSwitcherOpen = () => undefined,
}: {
	isLogin: boolean,
	isSubmitting: boolean,
	setIsSubmitting: (isSubmitting: boolean) => void,
	error: React.ReactNode,
	setError: (error: React.ReactNode) => void,
	setIsAwaitingRedirect: (isAwaitingRedirect: boolean) => void,
	isAccountSwitcherOpen?: boolean,
	setIsAccountSwitcherOpen?: (isOpen: boolean) => void,
}) => {
	const { isOnline, updateOnlineStatus } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);

	const [inProgress, setInProgress] = useState(false);
	const [name, setName] = useState("");
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<(accept: boolean) => void>(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);

	const { hasPolicyLinks } = usePolicyLinks();
	const { t } = useTranslation();
	const [retrySignupFrom, setRetrySignupFrom] = useState(null);

	const cachedUsers = keystore.getCachedUsers();
	const loginableCachedUsers = cachedUsers.filter((cachedUser) => cachedUser?.prfKeys?.length > 0);
	const [selectedCachedUser, setSelectedCachedUser] = useState<CachedUser | null>(null);
	const activeCachedUser = loginableCachedUsers.find(
		(cachedUser) => cachedUser.userHandleB64u === selectedCachedUser?.userHandleB64u
	) ?? loginableCachedUsers[0] ?? null;

	useEffect(
		() => {
			setError("");
		},
		[isLogin, setError],
	);

	useEffect(() => {
		if (isAccountSwitcherOpen && loginableCachedUsers.length === 0) {
			setIsAccountSwitcherOpen(false);
		}
	}, [isAccountSwitcherOpen, loginableCachedUsers.length, setIsAccountSwitcherOpen]);

	const promptForPrfRetry = async (): Promise<boolean> => {
		setNeedPrfRetry(true);
		setPrfRetryAccepted(false);
		return new Promise((resolve: (accept: boolean) => void, _reject) => {
			setResolvePrfRetryPrompt(() => resolve);
		}).then((accept) => {
			setNeedPrfRetry(false);
			setResolvePrfRetryPrompt(null);
			setPrfRetryAccepted(accept); // only true if the user clicked Continue
			return accept;
		});
	};

	const onLogin = async (webauthnHints: string[], cachedUser?: CachedUser) => {
		const result = await api.loginWebauthn(keystore, promptForPrfRetry, webauthnHints, cachedUser);
		if (result.ok) {
			setIsAwaitingRedirect(true);
		} else {
			// Using a switch here so the t() argument can be a literal, to ease searching
			switch (result.val) {
				case 'loginKeystoreFailed':
					setError(t('loginSignup.loginKeystoreFailed'));
					break;

				case 'passkeyInvalid':
					setError(t('loginSignup.passkeyInvalid'));
					break;

				case 'passkeyLoginFailedTryAgain':
					setError(t('loginSignup.passkeyLoginFailedTryAgain'));
					break;

				case 'passkeyLoginFailedServerError':
					setError(t('loginSignup.passkeyLoginFailedServerError'));
					break;

				case 'x-private-data-etag':
					setError(t('loginSignup.privateDataConflict'));
					break;

				default:
					throw result;
			}
		}
	};

	const onSignup = async (name: string, webauthnHints: string[]) => {
		const result = await api.signupWebauthn(
			name,
			keystore,
			retrySignupFrom
				? async () => true // "Try again" already means user agreed to continue
				: promptForPrfRetry,
			webauthnHints,
			retrySignupFrom,
		);
		if (result.ok) {
			setIsAwaitingRedirect(true);
		} else if (result.err) {
			// Using a switch here so the t() argument can be a literal, to ease searching
			switch (result.val) {
				case 'passkeySignupFailedServerError':
					setError(t('loginSignup.passkeySignupFailedServerError'));
					break;

				case 'passkeySignupFailedTryAgain':
					setError(t('loginSignup.passkeySignupFailedTryAgain'));
					break;

				case 'passkeySignupFinishFailedServerError':
					setError(t('loginSignup.passkeySignupFinishFailedServerError'));
					break;

				case 'passkeySignupKeystoreFailed':
					setError(t('loginSignup.passkeySignupKeystoreFailed'));
					break;

				case 'passkeySignupPrfNotSupported':
					setError(
						<Trans
							i18nKey="loginSignup.passkeySignupPrfNotSupported"
							components={{
								docLink: <a
									href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
									className="font-medium text-lm-gray-900 hover:underline dark:text-dm-gray-100"
									aria-label={t('loginSignup.passkeySignupPrfNotSupportedAriaLabel')}
								/>
							}}
						/>
					);
					break;

				default:
					if (result.val?.errorId === 'prfRetryFailed') {
						setRetrySignupFrom(result.val?.retryFrom);

					} else {
						setError(t('loginSignup.passkeySignupPrfRetryFailed'));
						throw result;
					}
			}
		}
	};

	const onSubmit = async (event: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
		event.preventDefault();
		const webauthnHint = (event.nativeEvent?.submitter as HTMLButtonElement)?.value;

		setError('');
		setInProgress(true);
		setIsSubmitting(true);

		if (isLogin) {
			await onLogin([webauthnHint]);

		} else {
			await onSignup(name, [webauthnHint]);
		}

		setInProgress(false);
		setIsSubmitting(false);
		checkForUpdates();
		updateOnlineStatus();
	};

	const onLoginCachedUser = async (cachedUser: CachedUser) => {
		setError('');
		setInProgress(true);
		setIsSubmitting(true);
		await onLogin([], cachedUser);
		setInProgress(false);
		setIsSubmitting(false);
		checkForUpdates();
		updateOnlineStatus();
	};

	const onForgetCachedUser = (cachedUser: CachedUser) => {
		keystore.forgetCachedUser(cachedUser);
	};

	const onCancel = () => {
		console.log("onCancel");
		setInProgress(false);
		setNeedPrfRetry(false);
		setPrfRetryAccepted(false);
		setResolvePrfRetryPrompt(null);
		setIsSubmitting(false);
		setRetrySignupFrom(null);
	};

	const nameByteLength = calculateByteSize(name);
	const nameByteLimit = 64;
	const nameByteLimitReached = nameByteLength > nameByteLimit;
	const nameByteLimitApproaching = nameByteLength >= nameByteLimit / 2;

	return (
		<form onSubmit={onSubmit}>
			{isAccountSwitcherOpen ? (
				<div>
					<button
						id="back-switch-account-loginsignup"
						type="button"
						onClick={() => setIsAccountSwitcherOpen(false)}
						className="mb-3 -ml-2 flex items-center gap-1 pl-2 pr-3 py-1.5 rounded-lg text-sm font-medium text-lm-gray-900 dark:text-dm-gray-100 cursor-pointer hover:bg-lm-gray-200 dark:hover:bg-dm-gray-800 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<ChevronLeft size={18} />
						{t('common.back')}
					</button>
					<h2 className="text-xl font-bold leading-tight tracking-tight text-lm-gray-900 md:text-2xl dark:text-white">
						{t('loginSignup.switchAccount')}
					</h2>
					<p className="mb-4 mt-1 text-sm text-lm-gray-900 dark:text-dm-gray-100">
						{t('loginSignup.switchAccountDescription')}
					</p>
					<div className="relative">
						<ul
							aria-label={t('loginSignup.switchAccountDescription')}
							className="flex flex-col gap-2 max-h-[40dvh] overflow-y-auto overflow-x-hidden overscroll-contain pr-2 pb-4 [scrollbar-gutter:stable]"
						>
							{loginableCachedUsers.map((cachedUser, index) => {
								const isActive = cachedUser.userHandleB64u === activeCachedUser?.userHandleB64u;
								return (
									<li key={cachedUser.userHandleB64u} className="w-full flex items-center gap-4">
									<button
										id={`switch-select-cached-user-${index}-loginsignup`}
										type="button"
										onClick={() => {
											setSelectedCachedUser(cachedUser);
											setIsAccountSwitcherOpen(false);
										}}
										disabled={isSubmitting}
										aria-label={t('loginSignup.selectUser', { name: cachedUser.displayName })}
										title={t('loginSignup.selectUser', { name: cachedUser.displayName })}
										className={`flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left rounded-lg border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive ? 'border-primary dark:border-white' : 'border-lm-gray-400 dark:border-dm-gray-600'} bg-lm-gray-200 dark:bg-dm-gray-800 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:bg-lm-gray-300 dark:hover:bg-dm-gray-700'}`}
									>
										<div aria-hidden="true" className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 select-none">
											<User size={20} />
										</div>
										<span className="flex-1 min-w-0 text-sm font-semibold text-lm-gray-900 dark:text-white truncate">
											{cachedUser.displayName}
										</span>
										{isActive && <Check size={18} aria-hidden="true" className="shrink-0 text-primary dark:text-white" />}
									</button>
									<button
										id={`switch-forget-cached-user-${index}-loginsignup`}
										type="button"
										onClick={() => onForgetCachedUser(cachedUser)}
										disabled={isSubmitting}
										aria-label={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
										title={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
										className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lm-gray-700 dark:text-dm-gray-300 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600'}`}
									>
										<X size={18} />
									</button>
									</li>
								);
							})}
						</ul>
						{loginableCachedUsers.length > 3 && (
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white/80 to-transparent dark:from-dm-gray-900/80"
							/>
						)}
					</div>
				</div>
			) : inProgress || retrySignupFrom
				? (
					needPrfRetry
						? (
							<div className="text-center">
								{
									prfRetryAccepted
										? (
											<p className="dark:text-white pb-3">{t('registerPasskey.messageInteract')}</p>
										)
										: (
											<>
												<h3 className="text-xl md:text-2xl mt-4 mb-2 font-bold text-lm-gray-900 dark:text-white">{t('registerPasskey.messageDone')}</h3>
												<p className="dark:text-white pb-3">
													{isLogin
														? t('loginSignup.authOnceMoreLogin')
														: t('registerPasskey.authOnceMore')
													}
												</p>
											</>
										)
								}
								<div className='flex justify-center gap-4'>
									<Button
										id="cancel-prf-loginsignup"
										onClick={() => resolvePrfRetryPrompt(false)}
									>
										{t('common.cancel')}
									</Button>
									<Button
										id="continue-prf-loginsignup"
										onClick={() => resolvePrfRetryPrompt(true)}
										variant="primary"
										disabled={prfRetryAccepted}
									>
										{t('common.continue')}
									</Button>
								</div>
							</div>
						)
						: (
							retrySignupFrom && !inProgress
								? (
									<div className="text-center">
										<p className="dark:text-white pb-3">
											<Trans
												i18nKey="registerPasskey.messageErrorTryAgain"
												components={{ br: <br /> }}
											/>
										</p>
										<div className='flex justify-center gap-4'>

											<Button
												id="cancel-prf-loginsignup"
												onClick={onCancel}
											>
												{t('common.cancel')}
											</Button>
											<Button
												id="try-again-prf-loginsignup"
												type="submit"
												variant="secondary"
											>
												{t('common.tryAgain')}
											</Button>
										</div>
									</div>
								)
								: (
									<>
										<p className="dark:text-white pb-3">{t('registerPasskey.messageInteract')}</p>
										<Button
											id="cancel-in-progress-prf-loginsignup"
											onClick={onCancel}
											additionalClassName='w-full'
										>
											{t('common.cancel')}
										</Button>
									</>
								)
						)
				)
				: (
					<>
						{!isLogin && (
							<>
								<FormInputRow label={t('loginSignup.choosePasskeyUsername')} name="name" IconComponent={Wallet}>
									<FormInputField
										ariaLabel="Passkey name"
										name="name"
										onChange={(event) => setName(event.target.value)}
										placeholder={t('loginSignup.enterPasskeyName')}
										type="text"
										value={name}
										required
									/>
									<div className={`flex flex-row flex-nowrap text-lm-gray-500 text-sm italic ${nameByteLimitReached ? 'text-lm-red' : ''} ${nameByteLimitApproaching ? 'h-auto mt-1' : 'h-0 mt-0'} transition-all`}>
										<div
											className={`text-lm-red dark:text-dm-red grow ${nameByteLimitReached ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity`}
											aria-hidden={!nameByteLimitReached}
										>
											{t('loginSignup.reachedLengthLimit')}
										</div>
										<div
											className={`text-right ${nameByteLimitApproaching ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity`}
											aria-hidden={!nameByteLimitApproaching}
										>
											{nameByteLength + `/64`}
										</div>
									</div>
								</FormInputRow>
								{hasPolicyLinks && (
									<label className="mb-4 text-sm relative block pl-6">
										<input className="absolute top-1 left-0 w-4 h-4 accent-primary cursor-pointer" type="checkbox" required />
										<span>
											<Trans
												i18nKey="loginSignup.acceptPolicies"
												components={{ policyLinks: <PolicyLinks /> }}
											/>
										</span>
									</label>
								)}
							</>)}

						{isLogin && activeCachedUser && (
							<>
								<CachedUsersList
									account={activeCachedUser}
									onSelect={onLoginCachedUser}
									onSwitchAccount={() => setIsAccountSwitcherOpen(true)}
									disabled={isSubmitting}
								/>
								<div className="my-4">
									<SeparatorLine>{t('common.or')}</SeparatorLine>
								</div>
							</>
						)}

						{(
							[
								{ btnLabel: isLogin ? t('loginSignup.loginWithPasskey') : t('loginSignup.signUpWithPasskey'), Icon: KeyRoundIcon, variant: coerce<Variant>(isLogin && activeCachedUser ? "outline" : "primary") },
								{ btnLabel: isLogin ? t('loginSignup.loginWithSecurityKey') : t('loginSignup.signUpWithSecurityKey'), Icon: UsbStickDotIcon, variant: coerce<Variant>("outline"), hint: "security-key", },
							].map(({ Icon, btnLabel, variant, hint }) => (
								<div key={btnLabel} className={`mt-2 relative w-full flex flex-col justify-center passkey-button-${hint}`}>
									<Button
										id={`${isSubmitting ? 'submitting' : isLogin ? 'loginPasskey' : 'loginSignup.signUpPasskey'}-${hint}-submit-loginsignup`}
										type="submit"
										variant={variant}
										size="lg"
										textSize="md"
										additionalClassName="items-center justify-center relative"
										disabled={!isLogin && (!isOnline || nameByteLimitReached)}
										title={!isLogin && (!isOnline ? t("common.offlineTitle") : nameByteLimitReached ? t('loginSignup.reachedLengthLimit') : undefined)}
										value={hint}
									>
										<div className="flex flex-col">
											<div className="flex flex-row items-center justify-center w-full">
												<Icon size={20} className="inline text-xl mr-2 shrink-0" />

												{isSubmitting
													? t('loginSignup.submitting')
													: btnLabel
												}
											</div>
										</div>
									</Button>
								</div>
							))
						)}

						{error && <div role="alert" className="text-lm-red dark:text-dm-red pt-2">{error}</div>}
					</>
				)
			}
		</form>
	);
};

export default WebauthnSignupLogin;
