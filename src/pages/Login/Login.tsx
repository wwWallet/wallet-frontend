import React, { useContext, useEffect, useState, ChangeEventHandler, FormEventHandler } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faInfoCircle, faLock, faTrash, faKey, faOctagonExclamation, faUserCircle, faCheck } from '@fortawesome/pro-regular-svg-icons';

import * as config from '@/config';
import { calculateByteSize } from '@/util';
import checkForUpdates from '@/offlineUpdateSW';

import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';

import type { CachedUser } from '@/services/LocalStorageKeystore';

import Button from '@/components/Buttons/Button';
import LoginLayout from '@/components/Auth/LoginLayout';
import SeparatorLine from '@/components/Shared/SeparatorLine';
import PasswordStrength from '@/components/Auth/PasswordStrength';

const FormInputRow = ({
	icon,
	children,
	label,
	name,
}) => (
	<div className="mb-4 relative">
		<label className="block text-c-lm-gray-900 dark:text-c-dm-gray-100 text-sm font-medium mb-2" htmlFor={name}>
			{icon &&
				<FontAwesomeIcon icon={icon} className="absolute left-3.5 top-11 z-10 text-c-lm-gray-700 dark:text-c-dm-gray-300" />
			}

			{label}
		</label>

		{children}
	</div>
);

const PasswordCriterionMessage = ({ text, ok }) => (
	<div className={`${ok ? "text-c-lm-green dark:text-c-dm-green" : "text-c-lm-gray-700 dark:text-c-dm-gray-300"} mt-1.5`}>
		<p className="text-sm">
			<FontAwesomeIcon icon={faCheck} className={`inline-block mr-2 ${ok ? '' : 'opacity-75'}`} />

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
	//General
	const { t } = useTranslation();

	//State
	const [show, setShow] = useState(false);

	//Handlers
	const onToggleShow = () => { setShow(!show); };

	//Render
	return (
		<div className="relative">
			<input
				className={`
					bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 
					dark:inputDarkModeOverride text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg w-full py-2.5 pl-10 pr-4
					outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
					placeholder:text-c-lm-gray-700 dark:placeholder:text-c-dm-gray-300
				`}
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
						className={`${show ? 'text-c-lm-gray-900 dark:text-c-dm-gray-100' : 'text-c-lm-gray-700 dark:text-c-dm-gray-300'} hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 transition-all duration-150`}
						aria-label={show ? (t('common.passwordHideAriaLabel')) : (t('common.passwordShowAriaLabel'))}
						title={show ? (t('common.passwordHideTitle')) : (t('common.passwordShowTitle'))}
						disabled={disabled}
					>
						<FontAwesomeIcon icon={show ? faEyeSlash : faEye} className='text-sm' fixedWidth />
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
	//General
	const { t } = useTranslation();

	//State
	const [formData, setFormData] = useState<UsernamePasswordFormData>({
		username: '',
		password: '',
		confirmPassword: '',
	});

	//Variables
	const { username, password, confirmPassword } = formData;

	//Handlers
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

	//Render
	return (
		<form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
			<FormInputRow label={t('loginSignup.usernameLabel')} name="username" icon={faUserCircle}>
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

			<FormInputRow label={t('loginSignup.passwordLabel')} name="password" icon={faLock}>
				<FormInputField
					ariaLabel="Password"
					name="password"
					onChange={handleInputChange}
					placeholder={t('loginSignup.enterPassword')}
					type="password"
					value={password}
					disabled={disabled}
				/>
				
				{choosePassword && password !== '' && 
					<PasswordStrength label={t('loginSignup.strength')} password={password} />
				}
			</FormInputRow>

			{choosePassword && (
				<FormInputRow label={t('loginSignup.confirmPasswordLabel')} name="confirm-password" icon={faLock}>
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
			size="xl"
			textSize="md"
			variant="tertiary"
			disabled={disabled}
			additionalClassName='w-full'
			>
				{submitButtonContent}
			</Button>
		</form>
	);
};

const WebauthnSignupLogin = ({
	isLogin,
	isSubmitting,
	setIsSubmitting,
	isLoginCache,
	setIsLoginCache,
	error,
	setError,
}: {
	isLogin: boolean,
	isSubmitting: boolean,
	setIsSubmitting: (isSubmitting: boolean) => void,
	isLoginCache: boolean,
	setIsLoginCache: (isLoginCache: boolean) => void,
	error: React.ReactNode,
	setError: (error: React.ReactNode) => void,
}) => {
	//General
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { api, keystore } = useContext(SessionContext);
	const { isOnline, updateOnlineStatus } = useContext(StatusContext);


	//State
	const [name, setName] = useState("");
	const [inProgress, setInProgress] = useState(false);
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [retrySignupFrom, setRetrySignupFrom] = useState(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<(accept: boolean) => void>(null);

	//Variables
	const from = location.search || '/';
	const cachedUsers = keystore.getCachedUsers();

	//Effects
	useEffect(
		() => {
			setError("");
		},
		[isLogin, setError],
	);

	//Handlers
	const promptForPrfRetry = async (): Promise<boolean> => {
		setNeedPrfRetry(true);
		return new Promise((resolve: (accept: boolean) => void, reject) => {
			setResolvePrfRetryPrompt(() => resolve);
		}).finally(() => {
			setNeedPrfRetry(false);
			setPrfRetryAccepted(true);
			setResolvePrfRetryPrompt(null);
		});
	};

	const onLogin = async (cachedUser?: CachedUser) => {
		const result = await api.loginWebauthn(keystore, promptForPrfRetry, cachedUser);
		if (result.ok) {
			navigate(from, { replace: true });

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

	const onSignup = async (name) => {
		const result = await api.signupWebauthn(
			name,
			keystore,
			retrySignupFrom ? 
				async () => true // "Try again" already means user agreed to continue
			: 
				promptForPrfRetry,
			retrySignupFrom,
		);
		if (result.ok) {
			navigate(from, { replace: true });

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
									className="font-medium text-primary hover:underline dark:text-blue-500"
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

	const onSubmit = async (event) => {
		event.preventDefault();

		setError('');
		setInProgress(true);
		setIsSubmitting(true);

		if (isLogin) {
			await onLogin();

		} else {
			await onSignup(name);
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
		await onLogin(cachedUser);
		setInProgress(false);
		setIsSubmitting(false);
		checkForUpdates();
		updateOnlineStatus();
	};

	const onForgetCachedUser = (cachedUser: CachedUser) => {
		setIsLoginCache(keystore.getCachedUsers().length - 1 > 0);
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

	//Prepare for render
	const nameByteLength = calculateByteSize(name);
	const nameByteLimit = 64;
	const nameByteLimitReached = nameByteLength > nameByteLimit;
	const nameByteLimitApproaching = nameByteLength >= nameByteLimit / 2;

	//Render
	return (
		<form onSubmit={onSubmit}>
			{(inProgress || retrySignupFrom) ? (
					needPrfRetry ? (
							<div className="">
								{
									prfRetryAccepted ? 
										<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mb-6">
											{t('registerPasskey.messageInteract')}
										</p>
									: <>
										<h3 className="text-xl font-bold text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-4 mb-4">
											{t('registerPasskey.messageDone')}
										</h3>
										
										<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mb-6 mr-4">
											{isLogin ? 
												t('loginSignup.authOnceMoreLogin')
											: 
												t('registerPasskey.authOnceMore')
											}
										</p>
									</>
								}
								
								<Button
									additionalClassName="w-full"
									size="lg"
									textSize="md"
									variant="tertiary"
									id="continue-prf-loginsignup"
									onClick={() => resolvePrfRetryPrompt(true)}
									disabled={prfRetryAccepted}
								>
									{t('common.continue')}
								</Button>

								<Button
									additionalClassName="mt-2 w-full"
									size="lg"
									textSize="md"
									variant="cancel"
									id="cancel-prf-loginsignup"
									onClick={() => resolvePrfRetryPrompt(false)}
								>
									{t('common.cancel')}
								</Button>
							</div>
						)
						: (
							retrySignupFrom && !inProgress
								? (
									<div className="">
										<h3 className="text-xl font-bold text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-4 mb-4">
											{t('registerPasskey.messageErrorTryAgainTitle')}
										</h3>
										
										<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mb-6 mr-4">
											{t('registerPasskey.messageErrorTryAgain')}
										</p>

										<Button
											additionalClassName="w-full"
											variant="tertiary"
											size="lg"
											textSize="md"
											id="try-again-prf-loginsignup"
											type="submit"
										>
											{t('common.tryAgain')}
										</Button>

										<Button
											additionalClassName="mt-2 w-full"
											variant="cancel"
											size="lg"
											textSize="md"
											id="cancel-prf-loginsignup"
											onClick={onCancel}
										>
											{t('common.cancel')}
										</Button>
									</div>
								)
								: (
									<>
										<div className='animate-height-in'>
											<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 pb-6">
												{t('registerPasskey.messageInteract')}
											</p>
										</div>

										<Button
											size="xl"
											textSize="md"
											id="cancel-in-progress-prf-loginsignup"
											onClick={onCancel}
											variant="cancel"
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
						<div className={`${error ? 'max-h-12 opacity-100' : 'max-h-0 opacity-0'} transition-[max-height] duration-200 overflow-hidden`}>
							<div className="flex items-center pb-6">
								<FontAwesomeIcon icon={faOctagonExclamation} className="text-c-lm-red dark:text-c-dm-red text-md mr-2" />

								<p className="text-md text-c-lm-red dark:text-c-dm-red">
									{error || "-"}
								</p>
							</div>
						</div>

						{!isLogin && 
							<FormInputRow label={t('loginSignup.choosePasskeyUsername')} name="name" icon={faUserCircle}>
								<FormInputField
									ariaLabel="Passkey name"
									name="name"
									onChange={(event) => setName(event.target.value)}
									placeholder={t('loginSignup.enterPasskeyName')}
									type="text"
									value={name}
									required
								/>

								<div 
								className={`
									flex flex-row flex-nowrap text-sm italic transition-all overflow-hidden
									${nameByteLimitReached ? 'text-c-lm-red dark:text-c-dm-red' : 'text-c-lm-gray-600 dark:text-c-dm-gray-400'} 
									${nameByteLimitApproaching ? 'max-h-12' : 'max-h-0'}
								`}
								>
									<div
										className={`flex-grow ${nameByteLimitReached ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity mt-1`}
										aria-hidden={!nameByteLimitReached}
									>
										{t('loginSignup.reachedLengthLimit')}
									</div>

									<div
										className={`text-right ${nameByteLimitApproaching ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity mt-1`}
										aria-hidden={!nameByteLimitApproaching}
									>
										{nameByteLength + `/64`}
									</div>
								</div>
							</FormInputRow>
						}

						{isLoginCache && 
							<ul className="overflow-y-auto overflow-x-hidden max-h-28 custom-scrollbar flex flex-col gap-2">
								{cachedUsers.filter(cachedUser => cachedUser?.prfKeys?.length > 0).map((cachedUser, index) => (
									<li
										key={cachedUser.userHandleB64u}
										className="w-full flex flex-row items-stretch gap-2"
									>
										<div className="flex flex-1 min-w-0">
											<Button
												id={`login-cached-user-${index}-loginsignup`}
												onClick={() => onLoginCachedUser(cachedUser)}
												variant="tertiary"
												textSize="md"
												disabled={isSubmitting}
												additionalClassName="w-full"
												ariaLabel={t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
												title={t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
											>
												<FontAwesomeIcon icon={faKey} className="text-lg mr-3" />

												<span className="truncate">
													{isSubmitting ? 
														t('loginSignup.submitting')
													: 
														cachedUser.displayName
													}
												</span>
											</Button>
										</div>

										<div>
											<Button
												id={`forget-cached-user-${index}-loginsignup`}
												onClick={() => onForgetCachedUser(cachedUser)}
												variant="delete"
												size="xl"
												square={true}
												textSize="md"
												disabled={isSubmitting}
												ariaLabel={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
												title={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
											>
												<FontAwesomeIcon icon={faTrash} className="text-lg" fixedWidth />
											</Button>
										</div>
									</li>
								))}
							</ul>
						}

						{!isLoginCache && 
							<Button
								id={`${isSubmitting ? 'submitting' : isLogin ? 'loginPasskey' : 'loginSignup.signupPasskey'}-submit-loginsignup`}
								type="submit"
								variant={config.LOGIN_WITH_PASSWORD ? "cancel" : "tertiary"}
								size="xl"
								textSize="md"
								disabled={isSubmitting || nameByteLimitReached || (!isLogin && !isOnline)}
								additionalClassName="w-full"
								title={!isLogin && !isOnline && t("common.offlineTitle")}
							>
								<FontAwesomeIcon icon={faKey} className="inline text-lg mr-3 shrink-0" />
								
								{isSubmitting ? 
									t('loginSignup.submitting')
								: isLogin ? 
									t('loginSignup.loginPasskey')
								: 
									t('loginSignup.signupPasskey')
								}
							</Button>
						}
					</>
				)
			}
		</form>
	);
};

const Auth = () => {
	//General
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const { isOnline, updateOnlineStatus } = useContext(StatusContext);

	//State
	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<React.ReactNode>('');
	const [webauthnError, setWebauthnError] = useState<React.ReactNode>('');
	const [isLoginCache, setIsLoginCache] = useState(keystore.getCachedUsers().length > 0);
	
	//Variables
	const from = location.search || '/';

	//Effects
	useEffect(() => {
		if (isLoggedIn) {
			navigate('/');
		}
	}, [isLoggedIn, navigate]);

	//Handlers
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
						<p className="text-md text-c-lm-red dark:text-c-dm-red">{t('loginSignup.weakPasswordError')}</p>
						
						{validations.map(({ ok, text }) => (
							<PasswordCriterionMessage key={text} ok={ok} text={text} />
						))}
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

	//Render
	return (
		<LoginLayout>
			<div className="relative space-y-4 md:space-y-6">
				<h1 className="text-xl font-bold leading-tight tracking-tight text-c-lm-gray-900 md:text-2xl dark:text-c-dm-gray-100">
					{isLoginCache ? t('loginSignup.loginCache') : isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
				</h1>

				{isOnline === false && 
					<p className="text-sm font-light text-c-lm-gray-700 dark:text-c-dm-gray-300 italic mb-2">
						<FontAwesomeIcon icon={faInfoCircle} className="text-sm inline-block text-c-lm-gray-700 dark:text-c-dm-gray-300 mr-2" />

						{t('loginSignup.messageOffline')}
					</p>
				}

				{!isLoginCache && config.LOGIN_WITH_PASSWORD ?
					<>
						<div>
							<div
							className={`${error ? typeof error !== 'string' ? 'max-h-60 opacity-100' : 'max-h-12 opacity-100' : 'max-h-0 opacity-0'} transition-[max-height] duration-200 overflow-hidden`}
							>
								<div className="flex items-start mb-6">
									<div className="flex items-center h-6">
										<FontAwesomeIcon icon={faOctagonExclamation} className="text-c-lm-red dark:text-c-dm-red text-md mr-2" />
									</div>

									<p className="text-md text-c-lm-red dark:text-c-dm-red">
										{error || "-"}
									</p>
								</div>
							</div>

							<UsernamePasswordForm
								choosePassword={!isLogin}
								disabled={isSubmitting}
								onChange={handleFormChange}
								onSubmit={handleFormSubmit}
								submitButtonContent={isSubmitting ? t('loginSignup.submitting') : isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
							/>
						</div>

						<SeparatorLine>{t('loginSignup.or')}</SeparatorLine>
					</>
				:
					null
				}

				<WebauthnSignupLogin
					isLogin={isLogin}
					isSubmitting={isSubmitting}
					setIsSubmitting={setIsSubmitting}
					isLoginCache={isLoginCache}
					setIsLoginCache={setIsLoginCache}
					error={webauthnError}
					setError={setWebauthnError}
				/>

				{!isLoginCache ? 
					<p className="text-sm font-light text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{isLogin ? t('loginSignup.newHereQuestion') : t('loginSignup.alreadyHaveAccountQuestion')}
						
						<Button
							key={`${isLogin ? 'signUp' : 'loginSignup.login'}-switch-loginsignup`}
							id={`${isLogin ? 'signUp' : 'loginSignup.login'}-switch-loginsignup`}
							variant="link"
							onClick={toggleForm}
							disabled={!isOnline}
							title={!isOnline && t('common.offlineTitle')}
						>
							{isLogin ? t('loginSignup.signUpHere') : t('loginSignup.loginInstead')}
						</Button>
					</p>
				:
					<p className="text-sm font-light text-c-lm-gray-700 dark:text-c-dm-gray-300 cursor-pointer">
						<Button
							id="useOtherAccount-switch-loginsignup"
							variant="link"
							onClick={useOtherAccount}
						>
							{t('loginSignup.useOtherAccount')}
						</Button>
					</p>
				}
			</div>
		</LoginLayout>
	);
};

export default Auth;
