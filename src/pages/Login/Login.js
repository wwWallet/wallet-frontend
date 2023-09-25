import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoPasskeyFill, GoTrash } from 'react-icons/go';
import { AiOutlineUnlock } from 'react-icons/ai';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook

import * as api from '../../api';
import { useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import logo from '../../assets/images/logo.png';
// import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
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
		<label className="block text-gray-700 dark:text-gray-400 text-sm font-bold mb-2" htmlFor={name}>
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
	const [inProgress, setInProgress] = useState(false);
	const [name, setName] = useState("");
	const [error, setError] = useState('');
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const navigate = useNavigate();
	const { t } = useTranslation();
	const keystore = useLocalStorageKeystore();

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
				navigate('/');

			} else {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (result.val) {
					case 'loginKeystoreFailed':
						setError(t('loginKeystoreFailed'));
						break;

					case 'passkeyInvalid':
						setError(t('passkeyInvalid'));
						break;

					case 'passkeyLoginFailedTryAgain':
						setError(t('passkeyLoginFailedTryAgain'));
						break;

					case 'passkeyLoginFailedServerError':
						setError(t('passkeyLoginFailedServerError'));
						break;

					default:
						throw result;
				}
			}
		},
		[keystore, navigate, t],
	);

	const onSignup = useCallback(
		async (name) => {
			const result = await api.signupWebauthn(name, keystore, promptForPrfRetry);
			if (result.ok) {
				navigate('/');

			} else {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (result.val) {
					case 'passkeySignupFailedServerError':
						setError(t('passkeySignupFailedServerError'));
						break;

					case 'passkeySignupFailedTryAgain':
						setError(t('passkeySignupFailedTryAgain'));
						break;

					case 'passkeySignupFinishFailedServerError':
						setError(t('passkeySignupFinishFailedServerError'));
						break;

					case 'passkeySignupKeystoreFailed':
						setError(t('passkeySignupKeystoreFailed'));

					default:
						throw result;
				}
			}
		},
		[keystore, navigate, t],
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
	};

	return (
		<form onSubmit={onSubmit}>
			{inProgress
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
												<h3 className="text-2xl mt-4 mb-2 font-bold text-custom-blue">Almost done!</h3>
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
									className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 mr-2"
									onClick={() => resolvePrfRetryPrompt(false)}
								>
									Cancel
								</button>
								<button
									type="button"
									className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
									onClick={() => resolvePrfRetryPrompt(true)}
									disabled={prfRetryAccepted}
								>
									Continue
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
				: (
					<>
						{!isLogin && (
							<>
								<FormInputRow label={t('choosePasskeyUsername')} name="name" IconComponent={FaUser}>
									<FormInputField
										ariaLabel="Passkey name"
										name="name"
										onChange={(event) => setName(event.target.value)}
										placeholder={t('enterPasskeyName')}
										type="text"
										value={name}
									/>
								</FormInputRow>
							</>)}

						{isLogin && (
							<ul>
								{cachedUsers.map((cachedUser) => (
									<li
										key={cachedUser.cacheKey}
										className="w-full flex flex-row flex-nowrap"
									>
										<button
											className="flex-grow text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
											type="button"
											disabled={isSubmitting}
											onClick={() => onLoginCachedUser(cachedUser)}
										>
											<GoPasskeyFill className="inline text-xl mr-2" />
											{isSubmitting ? t('submitting') : t('loginAsUser', { name: cachedUser.displayName })}
										</button>

										<button
											className="text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
											type="button"
											disabled={isSubmitting}
											onClick={() => onForgetCachedUser(cachedUser)}
											aria-label={t('forgetCachedUser', { name: cachedUser.displayName })}
										>
											<GoTrash className="inline text-xl" />
										</button>
									</li>
								))}
							</ul>
						)}

						{cachedUsers?.length > 0 && <SeparatorLine className="my-4"/>}

						<button
							className="w-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
							type="submit"
							disabled={isSubmitting}
						>
							<GoPasskeyFill className="inline text-xl mr-2" />
							{isSubmitting
								? t('submitting')
								: isLogin
									? cachedUsers?.length > 0
										? t('loginOtherPasskey')
										: t('loginPasskey')
									: t('signupPasskey')
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
	const { t } = useTranslation();

	const [formData, setFormData] = useState({
		username: '',
		password: '',
		confirmPassword: '',
	});
	const [error, setError] = useState('');
	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
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
			setError(t('fillInFieldsError'));
			return;
		}

		if (!isLogin && password !== confirmPassword) {
			setError(t('passwordsNotMatchError'));
			return;
		}

		// Validate password criteria
		if (!isLogin){
			const validations = [
				{ ok: password.length >= 8, text: t('passwordLength') },
				{ ok: /[A-Z]/.test(password), text: t('capitalLetter') },
				{ ok: /[0-9]/.test(password), text: t('number') },
				{ ok: /[^A-Za-z0-9]/.test(password), text: t('specialCharacter') },
			];

			if (!validations.every(({ ok }) => ok)) {
				setError(
					<>
						<p className="text-red-500 font-bold">{t('weakPasswordError')}</p>
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
				navigate('/');
			} else {
				setError(t('incorrectCredentialsError'));
			}

		} else {
			const result = await api.signup(username, password, keystore);
			if (result.ok) {
				navigate('/');
			} else {
				setError(t('usernameExistsError'));
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

	return (
		<section className="bg-gray-100 dark:bg-gray-900 h-full">
			<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-max min-h-screen pb-20">
				<a href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
					<img className="w-40" src={logo} alt="logo" />
				</a>

				<h1 className="text-3xl mb-7 font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
				{t('welcomeMessagepart1')} <span className='text-custom-blue'>{t('welcomeMessagepart2')}</span> 
				</h1>

				<div className="relative w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
					{/* Dropdown to change language */}
					{/* <div className="absolute top-2 right-2">
						<LanguageSelector />
					</div> */}

					<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
						<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
							{isLogin ? t('login') : t('signUp')}
						</h1>
						{ (loginWithPassword) ? 
							<>
								<form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
									{error && <div className="text-red-500">{error}</div>}
									<FormInputRow label={t('usernameLabel')} name="username" IconComponent={FaUser}>
										<FormInputField
											ariaLabel="Username"
											name="username"
											onChange={handleInputChange}
											placeholder={t('enterUsername')}
											type="text"
											value={username}
										/>
									</FormInputRow>
		
									<FormInputRow label={t('passwordLabel')} name="password" IconComponent={FaLock}>
										<FormInputField
											ariaLabel="Password"
											name="password"
											onChange={handleInputChange}
											placeholder={t('enterPassword')}
											type="password"
											value={password}
										/>
										{!isLogin && password !== '' && <PasswordStrength label={t('strength')} value={passwordStrength} />}
									</FormInputRow>
		
									{!isLogin && (
										<FormInputRow label={t('confirmPasswordLabel')} name="confirm-password" IconComponent={FaLock}>
											<FormInputField
												ariaLabel="Confirm Password"
												name="confirmPassword"
												onChange={handleInputChange}
												placeholder={t('enterconfirmPasswordLabel')}
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
										{isSubmitting ? t('submitting') : isLogin ? t('login') : t('signUp')}
									</button>
								</form>
								<SeparatorLine>OR</SeparatorLine> 
							</>
							: 
							<></>
						}


						<WebauthnSignupLogin
							isLogin={isLogin}
							isSubmitting={isSubmitting}
							setIsSubmitting={setIsSubmitting}
						/>

						<p className="text-sm font-light text-gray-500 dark:text-gray-400">
							{isLogin ? t('newHereQuestion') : t('alreadyHaveAccountQuestion')}
							<a
								href="/"
								className="font-medium text-blue-600 hover:underline dark:text-blue-500"
								onClick={toggleForm}
							>
								{isLogin ? t('signUp') : t('login')}
							</a>
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Login;
