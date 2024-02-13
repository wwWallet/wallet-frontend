import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaExclamationTriangle, FaEyeSlash, FaInfoCircle, FaLock, FaUser } from 'react-icons/fa';
import { GoPasskeyFill, GoTrash } from 'react-icons/go';
import { AiOutlineUnlock } from 'react-icons/ai';
import { Trans, useTranslation } from 'react-i18next';

import { useApi } from '../../api';
import { useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import logo from '../../assets/images/logo.png';

// import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
import * as CheckBrowserSupport from '../../components/BrowserSupport';
import SeparatorLine from '../../components/SeparatorLine';

const loginWithPassword = process.env.REACT_APP_LOGIN_WITH_PASSWORD ?
	process.env.REACT_APP_LOGIN_WITH_PASSWORD == 'true' :
	false;

const FormInputRow = ({
	IconComponent,
	children,
	label,
	name,
}) => (
	<div className="mb-4 relative">
		<label className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2" htmlFor={name}>
			<IconComponent className="absolute left-3 top-10 z-10 text-gray-500" />
			{label}
		</label>
		{children}
	</div>
);

const PasswordCriterionMessage = ({ text, ok }) => (
	<p className={ok ? "text-green-500" : "text-red-500"}>
		<span className="text-sm">
			<AiOutlineUnlock className="inline-block mr-2" />
			{text}
		</span>
	</p>
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

	return (
		<div className="relative">
			<input
				className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
						className="text-gray-500 focus:outline-none"
					>
						{show ? <FaEyeSlash /> : <FaEye />}
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
	const api = useApi();
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

					default:
						throw result;
				}
			}
		},
		[api, keystore, navigate, t],
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
								i18nKey ="loginSignup.passkeySignupPrfNotSupported"
								components={{
									docLink: <a
										href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
										className="font-medium text-custom-blue hover:underline dark:text-blue-500"
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
		[api, retrySignupFrom, keystore, navigate, t],
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
	const nameByteLimitReached = nameByteLength > 64;

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
												<h3 className="text-2xl mt-4 mb-2 font-bold text-custom-blue dark:text-custom-light-blue">Almost done!</h3>
												<p className="dark:text-white pb-3">
													{isLogin
														? 'To finish unlocking the wallet, please authenticate with your passkey once more.'
														: 'To finish setting up your wallet, please authenticate with your passkey once more.'
													}
												</p>
											</>
										)
								}

								<button
									type="button"
									className="bg-white px-4 py-2  border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-100 mr-2"
									onClick={() => resolvePrfRetryPrompt(false)}
								>
									Cancel
								</button>
								<button
									type="button"
									className="text-white bg-blue-600 text-sm px-4 py-2 text-center rounded-lg dark:bg-blue-600 dark:hover:bg-blue-700"
									onClick={() => resolvePrfRetryPrompt(true)}
									disabled={prfRetryAccepted}
								>
									Continue
								</button>
							</div>
						)
						: (
							retrySignupFrom && !inProgress
								? (
									<div className="text-center">
										<p className="dark:text-white pb-3">Something went wrong, please try again.</p>
										<p className="dark:text-white pb-3">Please note that you need to use the same passkey you created in the previous step.</p>

										<button
											type="button"
											className="border border-gray-300 hover:bg-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2"
											onClick={onCancel}
										>
											Cancel
										</button>
										<button
											className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
											type="submit"
										>
											{t('loginSignup.tryAgain')}
										</button>
									</div>
								)
								: (
									<>
										<p className="dark:text-white pb-3">Please interact with your authenticator...</p>
										<button
											type="button"
											className="w-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
											onClick={onCancel}
										>
											Cancel
										</button>
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
									<div className={`flex flex-row flex-nowrap text-gray-500 text-sm italic mt-1 ${nameByteLimitReached ? 'text-red-500' : ''} transition-colors` }>
										<div
											className={`text-red-500 flex-grow ${nameByteLimitReached ? 'opacity-100' : 'opacity-0 select-none'} transition-opacity`}
											aria-hidden={!nameByteLimitReached}
										>
											{t('loginSignup.reachedLengthLimit')}
										</div>
										<div className="text-right">
											{nameByteLength} / 64
										</div>
									</div>
								</FormInputRow>
							</>)}

						{isLogin && (
							<ul className="overflow-y-auto max-h-24 custom-scrollbar">
								{cachedUsers.map((cachedUser) => (
									<li
										key={cachedUser.userHandleB64u}
										className="w-full flex flex-row flex-nowrap mb-2"
									>
										<button
											className="flex-grow text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center mr-2"
											type="button"
											disabled={isSubmitting}
											onClick={() => onLoginCachedUser(cachedUser)}
										>
											<GoPasskeyFill className="inline text-xl mr-2" />
											{isSubmitting ? t('loginSignup.submitting') : t('loginSignup.loginAsUser', { name: cachedUser.displayName })}
										</button>

										<button
											className="text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
											type="button"
											disabled={isSubmitting}
											onClick={() => onForgetCachedUser(cachedUser)}
											aria-label={t('loginSignup.forgetCachedUser', { name: cachedUser.displayName })}
										>
											<GoTrash className="inline text-xl" />
										</button>
									</li>
								))}
							</ul>
						)}

						{isLogin && cachedUsers?.length > 0 && <SeparatorLine className="my-4"/>}

						<button
							className={`w-full text-white bg-custom-blue hover:bg-custom-blue-hover dark:text-gray-900 dark:hover:bg-gray-300 dark:bg-custom-light-blue focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center ${nameByteLimitReached && 'cursor-not-allowed bg-gray-300 hover:bg-gray-300'}`} 
							type="submit"
							disabled={isSubmitting || nameByteLimitReached}
						>
							<GoPasskeyFill className="inline text-xl mr-2" />
							{isSubmitting
								? t('loginSignup.submitting')
								: isLogin
									? cachedUsers?.length > 0
										? t('loginSignup.loginOtherPasskey')
										: t('loginSignup.loginPasskey')
									: t('loginSignup.signupPasskey')
							}
						</button>
						{error && <div className="text-red-500 pt-4">{error}</div>}
					</>
				)
			}
		</form>
	);
};

const Login = () => {
	const api = useApi();
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

	const navigate = useNavigate();
	const keystore = useLocalStorageKeystore();

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
		if (!isLogin){
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
						{validations.map(({ok, text}) => <PasswordCriterionMessage key={text} ok={ok} text={text} />)}
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
		setIsLogin(!isLogin);
		setError('');
		setFormData({
			username: '',
			password: '',
			confirmPassword: '',
		});
	};

	const getPasswordStrength = (password) => {
		const lengthScore = password.length >= 8 ? 25 : 0;
		const capitalScore = /[A-Z]/.test(password) ? 25 : 0;
		const numberScore = /[0-9]/.test(password) ? 25 : 0;
		const specialCharScore = /[^A-Za-z0-9]/.test(password) ? 25 : 0;

		return lengthScore + capitalScore + numberScore + specialCharScore;
	};

	const passwordStrength = getPasswordStrength(password);

	useEffect(() => {
    setTimeout(() => {
      setIsContentVisible(true);
    }, 0);
  }, []);

	return (
		<section className="bg-gray-100 dark:bg-gray-900 h-full">
			<div className={`fade-in-content ${isContentVisible ? 'visible' : ''}`}>
				<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-max min-h-screen pb-20">
					<a href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
						<img className="w-40" src={logo} alt="logo" />
					</a>

					<h1 className="text-3xl mb-7 font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
						<Trans
							i18nKey="loginSignup.welcomeMessage"
							components={{
								highlight: <span className="text-custom-blue dark:text-custom-light-blue" />
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
								<p className="text-sm font-light text-gray-500 dark:text-gray-200 italic mb-2">
									<CheckBrowserSupport.If test={(ctx) => ctx.browserSupported}>
										<FaInfoCircle className="text-md inline-block text-gray-500 mr-2" />
										<Trans
											i18nKey="loginSignup.learnMoreAboutPrfCompatibilityLaunchpadAndScenarios"
											components={{
												docLinkPrf: <a
													href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
													className="font-medium text-custom-blue hover:underline dark:text-blue-500"
												/>,
												docLinkLaunchpad: <a
												href="https://launchpad.wwwallet.org" target='blank_'
												className="font-medium text-custom-blue hover:underline dark:text-blue-500"
												/>,
												docLinkScenarios: <a
												href="https://wwwallet.github.io/wallet-docs/docs/showcase/sample-scenarios" target='blank_'
												className="font-medium text-custom-blue hover:underline dark:text-blue-500"
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
													href="https://github.com/wwWallet/wallet-frontend#prf-compatibility" target='blank_'
													className="font-medium text-custom-blue hover:underline dark:text-blue-500"
												/>
											}}
										/>
									</CheckBrowserSupport.If>
								</p>
							</CheckBrowserSupport.If>
						</CheckBrowserSupport.Ctx>
						<div className="p-6 space-y-4 md:space-y-6 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-700">
							<CheckBrowserSupport.WarningPortal>
								<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
									{isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
								</h1>
								{ (loginWithPassword) ?
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

											<button
												className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
												type="submit"
												disabled={isSubmitting}
											>
												{isSubmitting ? t('loginSignup.submitting') : isLogin ? t('loginSignup.login') : t('loginSignup.signUp')}
											</button>
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
										href="/"
										className="font-medium text-custom-blue hover:underline dark:text-custom-light-blue"
										onClick={toggleForm}
									>
										{isLogin ? t('loginSignup.signUp') : t('loginSignup.login')}
									</a>
								</p>
							</CheckBrowserSupport.WarningPortal>
						</div>
					</div>
				</div>
			</div>
			<div className='bg-gray-100 dark:bg-gray-900 text-gray-100 dark:text-gray-900 font-small w-full text-right'>{process.env.REACT_APP_VERSION}</div>
		</section>
	);
};

export default Login;
