import React, { useContext, useEffect, useState, ChangeEventHandler, FormEventHandler } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaInfoCircle, FaLock, FaUser } from 'react-icons/fa';
import { GoPasskeyFill, GoTrash } from 'react-icons/go';
import { AiOutlineUnlock } from 'react-icons/ai';
import { Trans, useTranslation } from 'react-i18next';

import type { CachedUser } from '../../services/LocalStorageKeystore';
import { calculateByteSize } from '../../util';

import StatusContext from '../../context/StatusContext';
import SessionContext from '../../context/SessionContext';

import * as config from '../../config';
import Button from '../../components/Buttons/Button';
import { PiWifiHighBold, PiWifiSlashBold } from "react-icons/pi";

// import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
import SeparatorLine from '../../components/SeparatorLine';
import PasswordStrength from '../../components/PasswordStrength';
import LoginPageLayout from './LoginPageLayout';


const FormInputRow = ({
	IconComponent,
	children,
	label,
	name,
}) => (
	<div className="mb-4 relative">
		<label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor={name}>
			<IconComponent className="absolute left-3 top-10 z-10 text-gray-500 dark:text-white" />
			{label}
		</label>
		{children}
	</div>
);

const PasswordCriterionMessage = ({ text, ok }) => (
	<div className={ok ? "text-green-500" : "text-red-500"}>
		<p className="text-sm">
			<AiOutlineUnlock className="inline-block mr-2" />
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
				className="border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700 dark:bg-transparent dark:text-white dark:inputDarkModeOverride w-full py-1.5 pl-10 pr-3"
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
						type="button"
						onClick={onToggleShow}
						className="text-gray-500 hover:text-gray-600"
						aria-label={show ? (t('common.passwordHideAriaLabel')) : (t('common.passwordShowAriaLabel'))}
						title={show ? (t('common.passwordHideTitle')) : (t('common.passwordShowTitle'))}
						disabled={disabled}
					>
						{show ? <FaEyeSlash className='dark:text-white' /> : <FaEye className='dark:text-white' />}
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
				<FormInputRow label={t('loginSignup.usernameLabel')} name="username" IconComponent={FaUser}>
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

				<FormInputRow label={t('loginSignup.passwordLabel')} name="password" IconComponent={FaLock}>
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
					<FormInputRow label={t('loginSignup.confirmPasswordLabel')} name="confirm-password" IconComponent={FaLock}>
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
	const { isOnline } = useContext(StatusContext);
	const { api, keystore } = useContext(SessionContext);

	const [inProgress, setInProgress] = useState(false);
	const [name, setName] = useState("");
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState<(accept: boolean) => void>(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.state?.from || '/';

	const { t } = useTranslation();
	const [retrySignupFrom, setRetrySignupFrom] = useState(null);

	const cachedUsers = keystore.getCachedUsers();

	useEffect(
		() => {
			setError("");
		},
		[isLogin, setError],
	);

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
			retrySignupFrom
				? async () => true // "Try again" already means user agreed to continue
				: promptForPrfRetry,
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
	};

	const onLoginCachedUser = async (cachedUser: CachedUser) => {
		setError('');
		setInProgress(true);
		setIsSubmitting(true);
		await onLogin(cachedUser);
		setInProgress(false);
		setIsSubmitting(false);
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
												<h3 className="text-2xl mt-4 mb-2 font-bold text-primary dark:text-primary-light">{t('registerPasskey.messageDone')}</h3>
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
										onClick={() => resolvePrfRetryPrompt(false)}
										variant="cancel"
									>
										{t('common.cancel')}
									</Button>
									<Button
										onClick={() => resolvePrfRetryPrompt(true)}
										variant="secondary"
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

											<Button variant="cancel" onClick={onCancel}>
												{t('common.cancel')}
											</Button>
											<Button type="submit" variant="secondary">
												{t('common.tryAgain')}
											</Button>
										</div>
									</div>
								)
								: (
									<>
										<p className="dark:text-white pb-3">{t('registerPasskey.messageInteract')}</p>
										<Button
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
						{!isLogin && (
							<>
								<FormInputRow label={t('loginSignup.choosePasskeyUsername')} name="name" IconComponent={FaUser}>
									<FormInputField
										ariaLabel="Passkey name"
										name="name"
										onChange={(event) => setName(event.target.value)}
										placeholder={t('loginSignup.enterPasskeyName')}
										type="text"
										value={name}
										required
									/>
									<div className={`flex flex-row flex-nowrap text-gray-500 text-sm italic ${nameByteLimitReached ? 'text-red-500' : ''} ${nameByteLimitApproaching ? 'h-4 mt-1' : 'h-0 mt-0'} transition-all`}>
										<div
											className={`text-red-500 flex-grow ${nameByteLimitReached ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity`}
											aria-hidden={!nameByteLimitReached}
										>
											{t('loginSignup.reachedLengthLimit')}
										</div>
										<div
											className={`text-right dark:text-gray-300 ${nameByteLimitApproaching ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity`}
											aria-hidden={!nameByteLimitApproaching}
										>
											{nameByteLength} / 64
										</div>
									</div>
								</FormInputRow>
							</>)}

						{isLoginCache && (
							<ul className="overflow-y-auto max-h-24 p-2 custom-scrollbar">
								{cachedUsers.filter(cachedUser => cachedUser?.prfKeys?.length > 0).map((cachedUser) => (
									<li
										key={cachedUser.userHandleB64u}
										className="w-full flex flex-row flex-nowrap mb-2"
									>
										<div className='flex-grow mr-2'>
											<Button
												onClick={() => onLoginCachedUser(cachedUser)}
												variant="tertiary"
												disabled={isSubmitting}
												additionalClassName='w-full'
											>
												<GoPasskeyFill className="inline text-xl mr-2" />
												{isSubmitting
													? t('loginSignup.submitting')
													: t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
											</Button>
										</div>
										<div>
											<Button
												onClick={() => onForgetCachedUser(cachedUser)}
												variant="tertiary"
												disabled={isSubmitting}
												ariaLabel={t('loginSignup.forgetCachedUserAriaLabel', { name: cachedUser.displayName })}
												title={t('loginSignup.forgetCachedUserTitle')}
											>
												<GoTrash className="inline text-xl" />
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}

						{!isLoginCache && (
							<Button
								type="submit"
								variant="primary"
								disabled={isSubmitting || nameByteLimitReached || (!isLogin && !isOnline)}
								additionalClassName="w-full"
								title={!isLogin && !isOnline && t("common.offlineTitle")}
							>
								<GoPasskeyFill className="inline text-xl mr-2" />
								{isSubmitting
									? t('loginSignup.submitting')
									: isLogin
										? t('loginSignup.loginPasskey')
										: t('loginSignup.signupPasskey')
								}
							</Button>
						)}
						{error && <div className="text-red-500 pt-4">{error}</div>}
					</>
				)
			}
		</form>
	);
};

const Login = () => {
	const { isOnline } = useContext(StatusContext);
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const { t } = useTranslation();
	const location = useLocation();

	const from = location.state?.from || '/';

	const [error, setError] = useState<React.ReactNode>('');
	const [webauthnError, setWebauthnError] = useState<React.ReactNode>('');
	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const navigate = useNavigate();
	const [isLoginCache, setIsLoginCache] = useState(keystore.getCachedUsers().length > 0);

	useEffect(() => {
		if (isLoggedIn) {
			navigate('/');
		}
	}, [isLoggedIn, navigate]);

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
						<p className="text-red-500 font-bold">{t('loginSignup.weakPasswordError')}</p>
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
		};
	}

	const useOtherAccount = () => {
		setIsLoginCache(false);
		setError('');
		setWebauthnError('');
	}

	return (
		<LoginPageLayout heading={
			<Trans
				i18nKey="loginSignup.welcomeMessage"
				components={{
					highlight: <span className="text-primary dark:text-primary-light" />
				}}
			/>
		}>

			<div className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
				<FaInfoCircle className="text-md inline-block text-gray-500 mr-2" />
				<Trans
					i18nKey="loginSignup.learnMoreAboutPrfCompatibilityLaunchpadAndScenarios"
					components={{
						docLinkPrf: <a
							href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
							className="font-medium text-primary dark:text-primary-light hover:underline"
							aria-label={t('loginSignup.learnMoreAboutPrfCompatibilityAriaLabel')}
						/>,
						docLinkLaunchpad: <a
							href="https://launchpad.wwwallet.org" target='blank_'
							className="font-medium text-primary dark:text-primary-light hover:underline"
							aria-label={t('loginSignup.learnMoreAboutLaunchpadAriaLabel')}
						/>,
						docLinkScenarios: <a
							href="https://wwwallet.github.io/wallet-docs/docs/showcase/sample-scenarios" target='blank_'
							className="font-medium text-primary dark:text-primary-light hover:underline"
							aria-label={t('loginSignup.learnMoreAboutScenariosAriaLabel')}
						/>
					}}
				/>
				<div className='mt-1'>
					<FaInfoCircle className="text-md inline-block text-gray-500 mr-2" />
					<Trans
						i18nKey="loginSignup.infoAboutTimeAndLocation"
					/>
				</div>
			</div>

			<div className="relative p-6 space-y-4 md:space-y-6 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
				<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
					{isLoginCache ? t('loginSignup.loginCache') : isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
				</h1>
				<div className='absolute text-gray-500 dark:text-white dark top-0 left-5'>
					{isOnline ? (
						<PiWifiHighBold size={25} title={t('common.online')} />
					) : (
						<PiWifiSlashBold size={25} title={t('common.offline')} />
					)}
				</div>
				{isOnline === false && (
					<p className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
						<FaInfoCircle size={14} className="text-md inline-block text-gray-500 mr-2" />
						{t('loginSignup.messageOffline')}
					</p>
				)}

				{!isLoginCache && config.LOGIN_WITH_PASSWORD ?
					<>
						{error && <div className="text-red-500">{error}</div>}
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
					setIsLoginCache={setIsLoginCache}
					error={webauthnError}
					setError={setWebauthnError}
				/>

				{!isLoginCache ? (
					<p className="text-sm font-light text-gray-500 dark:text-gray-200">
						{isLogin ? t('loginSignup.newHereQuestion') : t('loginSignup.alreadyHaveAccountQuestion')}
						<Button
							variant="link"
							onClick={toggleForm}
							disabled={!isOnline}
							title={!isOnline && t('common.offlineTitle')}
						>
							{isLogin ? t('loginSignup.signUp') : t('loginSignup.login')}
						</Button>
					</p>
				) : (
					<p className="text-sm font-light text-gray-500 dark:text-gray-200 cursor-pointer">
						<Button variant="link" onClick={useOtherAccount}>
							{t('loginSignup.useOtherAccount')}
						</Button>
					</p>
				)}

			</div>
		</LoginPageLayout>
	);
};

export default Login;
