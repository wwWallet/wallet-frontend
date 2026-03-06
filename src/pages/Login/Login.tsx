import React, { useContext, useEffect, useState, useCallback, ChangeEventHandler, FormEventHandler } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import type { CachedUser } from '../../services/LocalStorageKeystore';
import { calculateByteSize, coerce } from '../../util';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import { useTenant } from '../../context/TenantContext';
import { buildTenantRoutePath, filterUsersByTenantID, matchesTenantFromUrl } from '../../lib/tenant';

import * as config from '../../config';
import Button, { Variant } from '../../components/Buttons/Button';

import LanguageSelector from '../../components/LanguageSelector/LanguageSelector';
import TenantSelector from '../../components/TenantSelector/TenantSelector';
import SeparatorLine from '../../components/Shared/SeparatorLine';
import PasswordStrength from '../../components/Auth/PasswordStrength';
import LoginLayout from '../../components/Auth/LoginLayout';
import checkForUpdates from '../../offlineUpdateSW';
import ConnectionStatusIcon from '../../components/Layout/Navigation/ConnectionStatusIcon';

import useScreenType from '@/hooks/useScreenType';
import { CircleQuestionMark, Eye, EyeOff, FingerprintIcon, Info, Lock, LockKeyholeOpen,SmartphoneNfcIcon, User, UserLock, X } from 'lucide-react';
import { UsbStickDotIcon } from '@/components/Shared/CustomIcons';

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

const PasswordCriterionMessage = ({ text, ok }) => (
	<div className={ok ? "text-lm-green dark:text-dm-green" : "text-lm-red dark:text-dm-red"}>
		<p className="text-sm">
			<LockKeyholeOpen className="inline-block mr-2" />
			{text}
		</p>
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
	type?: 'password' | 'text',
}) => {
	const [show, setShow] = useState(false);
	const onToggleShow = () => { setShow(!show); };
	const { t } = useTranslation();

	return (
		<div className="relative">
			<input
				className="w-full pl-10 pr-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 dark:text-white rounded-lg dark:inputDarkModeOverride"
				type={show ? 'text' : type}
				name={name}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				aria-label={ariaLabel}
				required={required}
				disabled={disabled}
			/>

			{type === 'password' && (
				<div className="absolute inset-y-0 right-3 flex items-center">
					<button
						id={`${show ? 'hide' : 'show'}-password-loginsignup`}
						type="button"
						onClick={onToggleShow}
						className="text-lm-gray-700 hover:text-lm-gray-900 dark:text-dm-gray-300 dark:hover:text-dm-gray-100"
						aria-label={show ? (t('common.passwordHideAriaLabel')) : (t('common.passwordShowAriaLabel'))}
						title={show ? (t('common.passwordHideTitle')) : (t('common.passwordShowTitle'))}
						disabled={disabled}
					>
						{show ? <EyeOff /> : <Eye />}
					</button>
				</div>
			)}
		</div>
	);
};

type UsernamePasswordFormData = {
	username: string,
	password: string,
	confirmPassword: string,
}

const UsernamePasswordForm = ({
	choosePassword,
	disabled,
	onChange,
	onSubmit,
	submitButtonContent,
}: {
	choosePassword?: boolean,
	disabled?: boolean,
	onChange: (changed: { username?: string, password?: string, confirmPassword?: string }) => void,
	onSubmit: (event: React.FormEvent<HTMLFormElement>, formData: UsernamePasswordFormData) => void,
	submitButtonContent: React.ReactNode,
}) => {
	const { t } = useTranslation();

	const [formData, setFormData] = useState<UsernamePasswordFormData>({
		username: '',
		password: '',
		confirmPassword: '',
	});
	const { username, password, confirmPassword } = formData;

	const handleInputChange: ChangeEventHandler<HTMLInputElement> = (event) => {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({
			...prevFormData,
			[name]: value,
		}));
		onChange({ [name]: value });
	};

	const handleFormSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
		onSubmit(event, formData);
	};

	return (
		<>
			<form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
				<FormInputRow label={t('loginSignup.usernameLabel')} name="username" IconComponent={User}>
					<FormInputField
						ariaLabel="Username"
						name="username"
						onChange={handleInputChange}
						placeholder={t('loginSignup.enterUsername')}
						type="text"
						value={username}
						disabled={disabled}
					/>
				</FormInputRow>

				<FormInputRow label={t('loginSignup.passwordLabel')} name="password" IconComponent={Lock}>
					<FormInputField
						ariaLabel="Password"
						name="password"
						onChange={handleInputChange}
						placeholder={t('loginSignup.enterPassword')}
						type="password"
						value={password}
						disabled={disabled}
					/>
					{choosePassword && password !== '' && <PasswordStrength label={t('loginSignup.strength')} password={password} />}
				</FormInputRow>

				{choosePassword && (
					<FormInputRow label={t('loginSignup.confirmPasswordLabel')} name="confirm-password" IconComponent={Lock}>
						<FormInputField
							ariaLabel="Confirm Password"
							name="confirmPassword"
							onChange={handleInputChange}
							placeholder={t('loginSignup.enterconfirmPasswordLabel')}
							type="password"
							value={confirmPassword}
							disabled={disabled}
						/>
					</FormInputRow>
				)}
				<Button
					id="submit-username-password-loginsignup"
					type="submit"
					variant="primary"
					disabled={disabled}
					additionalClassName='w-full'
				>
					{submitButtonContent}
				</Button>
			</form>
		</>
	);
};

const WebauthnSignupLogin = ({
	isLogin,
	isSubmitting,
	setIsSubmitting,
	isLoginCache,
	error,
	setError,
}: {
	isLogin: boolean,
	isSubmitting: boolean,
	setIsSubmitting: (isSubmitting: boolean) => void,
	isLoginCache: boolean,
	error: React.ReactNode,
	setError: (error: React.ReactNode) => void,
}) => {
	const { isOnline, updateOnlineStatus } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);
	const { effectiveTenantId, urlTenantId } = useTenant();
	const screenType = useScreenType();
	const navigate = useNavigate();
	const location = useLocation();

	const [inProgress, setInProgress] = useState(false);
	const [name, setName] = useState("");
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<(accept: boolean) => void>(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);

	const { t } = useTranslation();
	const [retrySignupFrom, setRetrySignupFrom] = useState(null);

	const cachedUsers = filterUsersByTenantID(urlTenantId, keystore.getCachedUsers());

	useEffect(
		() => {
			setError("");
		},
		[isLogin, setError],
	);

	const promptForPrfRetry = async (): Promise<boolean> => {
		setNeedPrfRetry(true);
		return new Promise((resolve: (accept: boolean) => void, _reject) => {
			setResolvePrfRetryPrompt(() => resolve);
		}).finally(() => {
			setNeedPrfRetry(false);
			setPrfRetryAccepted(true);
			setResolvePrfRetryPrompt(null);
		});
	};

	const onLogin = useCallback(async (webauthnHints: string[], cachedUser?: CachedUser) => {
		const result = await api.loginWebauthn(keystore, promptForPrfRetry, webauthnHints, cachedUser, effectiveTenantId);
		if (result.ok) {
			// Success - no action needed, session will be set by API
		} else {
			const err = result.val;

			// Using a switch here so the t() argument can be a literal, to ease searching
			switch (err) {
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
	}, [api, keystore, effectiveTenantId, navigate, setError, t]);

	const onSignup = async (name: string, webauthnHints: string[]) => {
		// Pass tenantId to ensure the passkey's userHandle includes the tenant prefix
		// This enables tenant-scoped authentication
		const result = await api.signupWebauthn(
			name,
			keystore,
			retrySignupFrom
				? async () => true // "Try again" already means user agreed to continue
				: promptForPrfRetry,
			webauthnHints,
			retrySignupFrom,
			urlTenantId || 'default',
		);
		if (result.ok) {

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
			{inProgress || retrySignupFrom
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
												<h3 className="text-2xl mt-4 mb-2 font-bold text-lm-gray-900 dark:text-white">{t('registerPasskey.messageDone')}</h3>
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
								<FormInputRow label={t('loginSignup.choosePasskeyUsername')} name="name" IconComponent={User}>
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
							</>)}

						{isLoginCache && (
							<ul className="overflow-y-auto overflow-x-hidden max-h-32 px-2 custom-scrollbar flex flex-col gap-2">
								{cachedUsers.filter(cachedUser => cachedUser?.prfKeys?.length > 0).map((cachedUser, index) => (
									<li
										key={cachedUser.userHandleB64u}
										className="w-full flex flex-row items-center gap-2"
									>
										<div className="flex flex-1 min-w-0">
											<Button
												id={`login-cached-user-${index}-loginsignup`}
												onClick={() => onLoginCachedUser(cachedUser)}
												size="xl"
												variant="primary"
												disabled={isSubmitting}
												additionalClassName="w-full"
												ariaLabel={t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
												title={t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
											>
												<UserLock size={20} className="inline text-xl mr-2 shrink-0" />
												<span className="truncate">
													{isSubmitting
														? t('loginSignup.submitting')
														: cachedUser.displayName
													}
												</span>
											</Button>
										</div>
										<div>
											<Button
												id={`forget-cached-user-${index}-loginsignup`}
												onClick={() => onForgetCachedUser(cachedUser)}
												square={true}
												size="xl"
												disabled={isSubmitting}
												ariaLabel={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
												title={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
											>
												<X size={20} className="text-xl" />
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}

						{!isLoginCache && !isLogin && (
							<label className="block text-dm-gray-800 dark:text-lm-gray-200 text-sm font-bold mb-2" htmlFor={name}>
								{t('loginSignup.choosePasskeyPlatform')}
							</label>
						)}

						{!isLoginCache && (
							[
								{ hint: "client-device", btnLabel: t('common.platformPasskey'), Icon: FingerprintIcon, variant: coerce<Variant>("primary"), helpText: "Fastest option, recommended" },
								{ hint: "security-key", btnLabel: t('common.externalPasskey'), Icon: UsbStickDotIcon, variant: coerce<Variant>("outline"), helpText: "Use a USB or hardware security key" },
								{ hint: "hybrid", btnLabel: t('common.hybridPasskey'), Icon: SmartphoneNfcIcon, variant: coerce<Variant>("outline"), helpText: "Scan QR or link mobile device" },
							].map(({ Icon, hint, btnLabel, variant, helpText }) => (
								<div key={hint} className='mt-2 relative w-full flex flex-col justify-center'>
									<Button
										id={`${isSubmitting ? 'submitting' : isLogin ? 'loginPasskey' : 'loginSignup.signUpPasskey'}-${hint}-submit-loginsignup`}
										type="submit"
										variant={variant}
										size="lg"
										textSize="md"
										additionalClassName="items-center justify-center relative"
										title={!isLogin && !isOnline && t("common.offlineTitle")}
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

											{screenType !== 'desktop' && (
												<span className="mt-2 text-xs">
													{helpText}
												</span>
											)}
										</div>
									</Button>

									{screenType === 'desktop' && (
										<div className="absolute -right-8 flex items-center ml-2 group">
											<CircleQuestionMark className={`w-4 h-4 text-lm-gray-800 dark:text-dm-gray-200 cursor-pointer`} aria-hidden="true" />

											<div className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:flex group-focus-within:flex px-3 py-2 rounded bg-lm-gray-800 text-lm-gray-100 text-xs whitespace-nowrap shadow-lg bottom-6">
												{helpText}
											</div>
										</div>
									)}
								</div>
							))
						)}

						{error && <div className="text-lm-red dark:text-dm-red pt-2">{error}</div>}
					</>
				)
			}
		</form>
	);
};

const Auth = () => {
	const { isOnline, updateOnlineStatus } = useContext(StatusContext);
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const { urlTenantId, effectiveTenantId } = useTenant();
	const { t } = useTranslation();
	const location = useLocation();

	const from = location.search || '/';

	const [error, setError] = useState<React.ReactNode>('');
	const [webauthnError, setWebauthnError] = useState<React.ReactNode>('');
	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const navigate = useNavigate();

	const { getCachedUsers } = keystore;
	const [isLoginCache, setIsLoginCache] = useState(
		filterUsersByTenantID(urlTenantId, getCachedUsers()).length > 0
	);

	useEffect(() => {
		setIsLoginCache(filterUsersByTenantID(urlTenantId, getCachedUsers()).length > 0);
	}, [getCachedUsers, setIsLoginCache, urlTenantId]);

	useEffect(() => {
		if (isLoggedIn) {
			if (matchesTenantFromUrl(effectiveTenantId, urlTenantId)) {
				navigate(buildTenantRoutePath(effectiveTenantId, `/${location.search}`), { replace: true });
			} else {
				window.location.href = buildTenantRoutePath(effectiveTenantId, `/${location.search}`);
			}
		}
	}, [effectiveTenantId, isLoggedIn, navigate, location.search, urlTenantId]);

	const handleFormChange = () => setError('');

	const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>, { username, password, confirmPassword }: UsernamePasswordFormData) => {
		event.preventDefault();

		if (username === '' || password === '') {
			setError(t('loginSignup.fillInFieldsError'));
			return;
		}

		if (!isLogin && password !== confirmPassword) {
			setError(t('loginSignup.passwordsNotMatchError'));
			return;
		}

		// Validate password criteria
		if (!isLogin) {
			const validations = [
				{ ok: password.length >= 8, text: t('loginSignup.passwordLength') },
				{ ok: /[A-Z]/.test(password), text: t('loginSignup.capitalLetter') },
				{ ok: /[0-9]/.test(password), text: t('loginSignup.number') },
				{ ok: /[^A-Za-z0-9]/.test(password), text: t('loginSignup.specialCharacter') },
			];

			if (!validations.every(({ ok }) => ok)) {
				setError(
					<>
						<p className="text-lm-red dark:text-dm-red font-bold">{t('loginSignup.weakPasswordError')}</p>
						{validations.map(({ ok, text }) => <PasswordCriterionMessage key={text} ok={ok} text={text} />)}
					</>
				);
				return;
			}
		}

		setIsSubmitting(true);

		if (isLogin) {
			const result = await api.login(username, password, keystore);
			if (result.ok) {
				navigate(from, { replace: true });
			} else {
				setError(t('loginSignup.incorrectCredentialsError'));
			}

		} else {
			const result = await api.signup(username, password, keystore);
			if (result.ok) {
				navigate(from, { replace: true });
			} else {
				setError(t('loginSignup.usernameExistsError'));
			}
		}

		setIsSubmitting(false);
	};

	const toggleForm = () => {
		if (isOnline || !isLogin) {
			setIsLogin(!isLogin);
			setError('');
			checkForUpdates();
			updateOnlineStatus();
		};
	}

	const useOtherAccount = () => {
		setIsLoginCache(false);
		setError('');
		setWebauthnError('');
		checkForUpdates();
		updateOnlineStatus();
	}

	return (
		<LoginLayout heading={
			<Trans
				i18nKey="loginSignup.welcomeMessage"
				components={{
					highlight: <span className="text-primary dark:text-brand-light" />
				}}
			/>
		}>
			<div className="relative p-8 sm:px-12 space-y-4 md:space-y-6 lg:space-y-8 bg-white rounded-lg dark:bg-dm-gray-900 border border-lm-gray-400 dark:border-dm-gray-600">
				<h1 className="pt-4 text-xl font-bold leading-tight tracking-tight text-dm-gray-900 md:text-2xl text-center dark:text-white">
					{isLoginCache ? t('loginSignup.loginCache') : isLogin ? t('loginSignup.loginTitle') : t('loginSignup.signUp')}
				</h1>
				<div className='absolute text-lm-gray-900 dark:text-white top-5 left-5'>
					<ConnectionStatusIcon backgroundColor='light' />
				</div>

				<div className='absolute top-5 right-5'>
					<LanguageSelector className='min-w-12 text-sm text-lm-gray-900 dark:text-white cursor-pointer bg-white dark:bg-dm-gray-900 appearance-none' />
				</div>

				{isOnline === false && (
					<p className="text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 italic mb-2">
						<Info size={14} className="text-md inline-block mr-1" />
						{t('loginSignup.messageOffline')}
					</p>
				)}

				{!isLoginCache && config.LOGIN_WITH_PASSWORD ?
					<>
						{error && <div className="text-lm-red dark:text-dm-red">{error}</div>}
						<UsernamePasswordForm
							choosePassword={!isLogin}
							disabled={isSubmitting}
							onChange={handleFormChange}
							onSubmit={handleFormSubmit}
							submitButtonContent={isSubmitting ? t('loginSignup.submitting') : isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
						/>
						<SeparatorLine>{t('loginSignup.or')}</SeparatorLine>
					</>
					:
					<></>
				}

				<WebauthnSignupLogin
					isLogin={isLogin}
					isSubmitting={isSubmitting}
					setIsSubmitting={setIsSubmitting}
					isLoginCache={isLoginCache}
					error={webauthnError}
					setError={setWebauthnError}
				/>

				{!isLoginCache ? (
					<p className="mb-4 text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 text-center">
						{isLogin ? t('loginSignup.newHereQuestion') : t('loginSignup.alreadyHaveAccountQuestion')}
						<Button
							id={`${isLogin ? 'signUp' : 'loginSignup.login'}-switch-loginsignup`}
							variant="link"
							onClick={toggleForm}
							disabled={!isOnline}
							title={!isOnline && t('common.offlineTitle')}
						>
							{isLogin ? t('loginSignup.signUp') : t('loginSignup.login')}
						</Button>
					</p>
				) : (
					<p className="mb-4 text-sm font-light text-lm-gray-900 dark:text-dm-gray-100 cursor-pointer">
						<Button
							id="useOtherAccount-switch-loginsignup"
							variant="link"
							onClick={useOtherAccount}
						>
							{t('loginSignup.useOtherAccount')}
						</Button>
					</p>
				)}

				{TenantSelector && (
					<div className="mb-4 text-sm flex justify-center">
						<TenantSelector
							currentTenantId={urlTenantId || 'default'}
							isAuthenticated={false}
						/>
					</div>
				)}
				</div>
		</LoginLayout>
	);
};

export default Auth;
