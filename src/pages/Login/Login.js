import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaEye, FaEyeSlash, FaInfoCircle, FaLock, FaUser } from 'react-icons/fa';
import { GoPasskeyFill, GoTrash } from 'react-icons/go';
import { AiOutlineUnlock } from 'react-icons/ai';
import { Trans, useTranslation } from 'react-i18next';
import { CSSTransition } from 'react-transition-group';

import * as config from '../../config';
import OnlineStatusContext from '../../context/OnlineStatusContext';
import { useApi } from '../../api';
import { useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import logo from '../../assets/images/logo.png';
import GetButton from '../../components/Buttons/GetButton';
import ConnectivityBars from '../../components/Connectivity/ConnectivityBars';

// import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
import * as CheckBrowserSupport from '../../components/BrowserSupport';
import SeparatorLine from '../../components/SeparatorLine';
import SessionContext from '../../context/SessionContext';


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
	name,
	onChange,
	placeholder,
	required,
	value,
	type,
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
			/>

			{type === 'password' && (
				<div className="absolute inset-y-0 right-3 flex items-center">
					<button
						type="button"
						onClick={onToggleShow}
						className="text-gray-500 hover:text-gray-600"
						aria-label={show ? (t('loginSignup.passwordHideAriaLabel')) : (t('loginSignup.passwordShowAriaLabel'))}
						title={show ? (t('loginSignup.passwordHideTitle')) : (t('loginSignup.passwordShowTitle'))}
					>
						{show ? <FaEyeSlash className='dark:text-white' /> : <FaEye className='dark:text-white' />}
					</button>
				</div>
			)}
		</div>
	);
};

const PasswordStrength = ({ label, value }) => (
	< div className="flex items-center mt-1" >
		<p className="text-sm text-gray-600 mr-2">{label}</p>
		<div className="flex flex-1 h-4 bg-lightgray rounded-full border border-gray-300">
			<div
				className={`h-full rounded-full ${value < 50
					? 'bg-red-500'
					: value >= 50 && value < 100
						? 'bg-yellow-500'
						: 'bg-green-500'
					}`}
				style={{ width: `${value}%` }}
			></div>
		</div>
	</div>
);

const WebauthnSignupLogin = ({
	isLogin,
	isSubmitting,
	setIsSubmitting,
}) => {
	const { isOnline } = useContext(OnlineStatusContext);
	const api = useApi(isOnline);
	const [inProgress, setInProgress] = useState(false);
	const [name, setName] = useState("");
	const [error, setError] = useState('');
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.state?.from || '/';

	const { t } = useTranslation();
	const keystore = useLocalStorageKeystore();
	const [retrySignupFrom, setRetrySignupFrom] = useState(null);

	const cachedUsers = keystore.getCachedUsers();

	useEffect(
		() => {
			setError("");
		},
		[isLogin],
	);

	const promptForPrfRetry = async () => {
		setNeedPrfRetry(true);
		return new Promise((resolve, reject) => {
			setResolvePrfRetryPrompt(() => resolve);
		}).finally(() => {
			setNeedPrfRetry(false);
			setPrfRetryAccepted(true);
			setResolvePrfRetryPrompt(null);
		});
	};

	const onLogin = useCallback(
		async (cachedUser) => {
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
		},
		[api, from, keystore, navigate, t],
	);

	const onSignup = useCallback(
		async (name) => {
			const result = await api.signupWebauthn(
				name,
				keystore,
				retrySignupFrom
					? () => Promise.resolve(true) // "Try again" already means user agreed to continue
					: promptForPrfRetry,
				retrySignupFrom,
			);
			if (result.ok) {
				navigate(from, { replace: true });

			} else {
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
		},
		[api, from, retrySignupFrom, keystore, navigate, t],
	);

	const onSubmit = async (event) => {
		event.preventDefault();

		setError();
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

	const onLoginCachedUser = async (cachedUser) => {
		setError();
		setInProgress(true);
		setIsSubmitting(true);
		await onLogin(cachedUser);
		setInProgress(false);
		setIsSubmitting(false);
	};

	const onForgetCachedUser = (cachedUser) => {
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

	const calculateByteSize = (string) => {
		const encoder = new TextEncoder();
		const encoded = encoder.encode(string);
		return encoded.length;
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
											<p className="dark:text-white pb-3">Please interact with your authenticator...</p>
										)
										: (
											<>
												<h3 className="text-2xl mt-4 mb-2 font-bold text-primary dark:text-primary-light">Almost done!</h3>
												<p className="dark:text-white pb-3">
													{isLogin
														? 'To finish unlocking the wallet, please authenticate with your passkey once more.'
														: 'To finish setting up your wallet, please authenticate with your passkey once more.'
													}
												</p>
											</>
										)
								}
								<div className='flex justify-center gap-4'>
									<GetButton
										content={t('common.cancel')}
										onClick={() => resolvePrfRetryPrompt(false)}
										variant="cancel"
									/>
									<GetButton
										content={t('common.continue')}
										onClick={() => resolvePrfRetryPrompt(true)}
										variant="secondary"
										disabled={prfRetryAccepted}
									/>
								</div>
							</div>
						)
						: (
							retrySignupFrom && !inProgress
								? (
									<div className="text-center">
										<p className="dark:text-white pb-3">Something went wrong, please try again.</p>
										<p className="dark:text-white pb-3">Please note that you need to use the same passkey you created in the previous step.</p>

										<div className='flex justify-center gap-4'>

											<GetButton
												content={t('common.cancel')}
												onClick={onCancel}
												variant="cancel"
											/>
											<GetButton
												type="submit"
												content={t('common.tryAgain')}
												variant="secondary"
											/>
										</div>
									</div>
								)
								: (
									<>
										<p className="dark:text-white pb-3">Please interact with your authenticator...</p>
										<GetButton
											content={t('common.cancel')}
											onClick={onCancel}
											variant="cancel"
											additionalClassName='w-full'
										/>
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

						{isLogin && (
							<ul className="overflow-y-auto max-h-24 p-2 custom-scrollbar">
								{cachedUsers.map((cachedUser) => (
									<li
										key={cachedUser.userHandleB64u}
										className="w-full flex flex-row flex-nowrap mb-2"
									>
										<div className='flex-grow mr-2'>
											<GetButton
												content={
													<>
														<GoPasskeyFill className="inline text-xl mr-2" />
														{isSubmitting ? t('loginSignup.submitting') : t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
													</>
												}
												onClick={() => onLoginCachedUser(cachedUser)}
												variant="tertiary"
												disabled={isSubmitting}
												additionalClassName='w-full'
											/>
										</div>
										<div>
											<GetButton
												content={
													<GoTrash className="inline text-xl" />
												}
												onClick={() => onForgetCachedUser(cachedUser)}
												variant="tertiary"
												disabled={isSubmitting}
												ariaLabel={t('loginSignup.forgetCachedUserAriaLabel', { name: cachedUser.displayName })}
												title={t('loginSignup.forgetCachedUserTitle')}
											/>
										</div>
									</li>
								))}
							</ul>
						)}

						{isLogin && cachedUsers?.length > 0 && <SeparatorLine className="my-4" />}

						<GetButton
							type="submit"
							content={
								<>
									<GoPasskeyFill className="inline text-xl mr-2" />
									{isSubmitting
										? t('loginSignup.submitting')
										: isLogin
											? cachedUsers?.length > 0
												? t('loginSignup.loginOtherPasskey')
												: t('loginSignup.loginPasskey')
											: t('loginSignup.signupPasskey')
									}
								</>
							}
							variant="primary"
							disabled={isSubmitting || nameByteLimitReached || (!isLogin && !isOnline)}
							additionalClassName={`w-full ${nameByteLimitReached || (!isLogin && !isOnline) ? 'cursor-not-allowed bg-gray-300 hover:bg-gray-300' : ''}`}
							title={!isLogin && !isOnline && t("common.offlineTitle")}
						/>
						{error && <div className="text-red-500 pt-4">{error}</div>}
					</>
				)
			}
		</form>
	);
};

const Login = () => {
	const { isOnline, connectivityQuality } = useContext(OnlineStatusContext);
	const { isLoggedIn } = useContext(SessionContext);
	const api = useApi(isOnline);
	const { t } = useTranslation();
	const location = useLocation();

	const from = location.state?.from || '/';

	const [formData, setFormData] = useState({
		username: '',
		password: '',
		confirmPassword: '',
	});
	const [error, setError] = useState('');
	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isContentVisible, setIsContentVisible] = useState(false);
	const nodeRef = useRef(null);

	const navigate = useNavigate();
	const keystore = useLocalStorageKeystore();

	useEffect(() => {
		if (isLoggedIn) {
			navigate('/');
		}
	}, [isLoggedIn, navigate]);

	const { username, password, confirmPassword } = formData;

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		setFormData((prevFormData) => ({
			...prevFormData,
			[name]: value,
		}));
		setError(''); // Clear the error message
	};

	const handleFormSubmit = async (event) => {
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

	const toggleForm = (event) => {
		event.preventDefault();
		if (isOnline || !isLogin) {
			setIsLogin(!isLogin);
			setError('');
			setFormData({
				username: '',
				password: '',
				confirmPassword: '',
			});
		};
	}

	const getPasswordStrength = (password) => {
		const lengthScore = password.length >= 8 ? 25 : 0;
		const capitalScore = /[A-Z]/.test(password) ? 25 : 0;
		const numberScore = /[0-9]/.test(password) ? 25 : 0;
		const specialCharScore = /[^A-Za-z0-9]/.test(password) ? 25 : 0;

		return lengthScore + capitalScore + numberScore + specialCharScore;
	};

	const passwordStrength = getPasswordStrength(password);

	useEffect(() => {
		setIsContentVisible(true);
	}, []);

	return (
		<section className="bg-gray-100 dark:bg-gray-900 h-full">

			<CSSTransition in={isContentVisible} timeout={400} classNames="content-fade-in" nodeRef={nodeRef}>
				<>
					<div ref={nodeRef} className='h-max min-h-screen'>
						<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-[95vh]">
							<a href="/" className="flex justify-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
								<img className="w-40" src={logo} alt="logo" />
							</a>

							<h1 className="text-3xl mb-7 font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
								<Trans
									i18nKey="loginSignup.welcomeMessage"
									components={{
										highlight: <span className="text-primary dark:text-primary-light" />
									}}
								/>
							</h1>

							<div className="relative w-full md:mt-0 sm:max-w-md xl:p-0">
								{/* Dropdown to change language */}
								{/* <div className="absolute top-2 right-2">
							<LanguageSelector />
						</div> */}
								<CheckBrowserSupport.Ctx>
									<CheckBrowserSupport.If test={(ctx) => !ctx.showWarningPortal}>
										<div className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
											<CheckBrowserSupport.If test={(ctx) => ctx.browserSupported}>
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
											</CheckBrowserSupport.If>
											<CheckBrowserSupport.If test={(ctx) => !ctx.browserSupported}>
												<FaExclamationTriangle className="text-md inline-block text-orange-600 mr-2" />
												<Trans
													i18nKey="loginSignup.learnMoreAboutPrfCompatibility"
													components={{
														docLinkPrf: <a
															href="https://github.com/wwWallet/wallet-frontend#prf-compatibility"
															target='blank_'
															className="font-medium text-primary hover:underline dark:text-blue-500"
															aria-label={t('loginSignup.learnMoreAboutPrfCompatibilityAriaLabel')}
														/>
													}}
												/>
											</CheckBrowserSupport.If>
										</div>
									</CheckBrowserSupport.If>
								</CheckBrowserSupport.Ctx>
								<div className="relative p-6 space-y-4 md:space-y-6 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
									<CheckBrowserSupport.WarningPortal>
										<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
											{isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
										</h1>
										<div className='absolute text-gray-500 dark:text-white dark top-0 left-5'>
											<ConnectivityBars
												quality={isOnline ? connectivityQuality : 0}
											/>
										</div>
										{isOnline === false && (
											<p className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
												<FaInfoCircle size={14} className="text-md inline-block text-gray-500 mr-2" />
												{t('loginSignup.messageOffline')}
											</p>
										)}
										{config.LOGIN_WITH_PASSWORD ?
											<>
												<form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
													{error && <div className="text-red-500">{error}</div>}
													<FormInputRow label={t('loginSignup.usernameLabel')} name="username" IconComponent={FaUser}>
														<FormInputField
															ariaLabel="Username"
															name="username"
															onChange={handleInputChange}
															placeholder={t('loginSignup.enterUsername')}
															type="text"
															value={username}
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
														/>
														{!isLogin && password !== '' && <PasswordStrength label={t('loginSignup.strength')} value={passwordStrength} />}
													</FormInputRow>

													{!isLogin && (
														<FormInputRow label={t('loginSignup.confirmPasswordLabel')} name="confirm-password" IconComponent={FaLock}>
															<FormInputField
																ariaLabel="Confirm Password"
																name="confirmPassword"
																onChange={handleInputChange}
																placeholder={t('loginSignup.enterconfirmPasswordLabel')}
																type="password"
																value={confirmPassword}
															/>
														</FormInputRow>
													)}
													<GetButton
														type="submit"
														content={isSubmitting ? t('loginSignup.submitting') : isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
														variant="primary"
														disabled={isSubmitting}
														additionalClassName='w-full'
													/>
												</form>
												<SeparatorLine>{t('loginSignup.or')}</SeparatorLine>
											</>
											:
											<></>
										}


										<WebauthnSignupLogin
											isLogin={isLogin}
											isSubmitting={isSubmitting}
											setIsSubmitting={setIsSubmitting}
										/>

										<p className="text-sm font-light text-gray-500 dark:text-gray-200">
											{isLogin ? t('loginSignup.newHereQuestion') : t('loginSignup.alreadyHaveAccountQuestion')}
											<a
												href={isLogin && isOnline ? "/" : ""}
												className={`font-medium ${isLogin && isOnline === false ? 'cursor-not-allowed text-gray-300 dark:text-gray-600 hover:no-underline' : 'text-primary hover:underline dark:text-primary-light '}`}
												title={`${isOnline === false && t('common.offlineTitle')}`}
												onClick={toggleForm}
											>
												{isLogin ? t('loginSignup.signUp') : t('loginSignup.login')}
											</a>
										</p>
									</CheckBrowserSupport.WarningPortal>
								</div>
							</div>
						</div>
						<div className='h-[5vh]'>
							<p className='text-gray-700 dark:text-gray-400 text-center min-mt-10'>
								<Trans
									i18nKey="sidebar.poweredBy"
									components={{
										docLinkWalletGithub: <a
											href="https://github.com/wwWallet"
											rel="noreferrer"
											target='blank_'
											className="underline text-primary dark:text-primary-light"
											aria-label={t('sidebar.poweredbyAriaLabel')}
										/>
									}}
								/>
							</p>
							<p className='bg-gray-100 dark:bg-gray-900 text-gray-100 dark:text-gray-900'>{config.APP_VERSION}</p>

						</div>
					</div>
				</>
			</CSSTransition>
		</section>
	);
};

export default Login;
