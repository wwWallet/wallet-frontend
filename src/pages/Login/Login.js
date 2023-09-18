import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { GoPasskeyFill } from 'react-icons/go';
import { AiOutlineUnlock } from 'react-icons/ai';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook

import * as api from '../../api';
import { useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import logo from '../../assets/images/ediplomasLogo.svg';
// import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
import SeparatorLine from '../../components/SeparatorLine';


const FormInputRow = ({
	IconComponent,
	children,
	label,
	name,
}) => (
	<div className="mb-4 relative">
		<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={name}>
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
	const navigate = useNavigate();
	const { t } = useTranslation();
	const keystore = useLocalStorageKeystore();

	useEffect(
		() => {
			setError("");
		},
		[isLogin],
	);

	const onLogin = useCallback(
		async () => {
			try {
				await api.loginWebauthn(keystore);
				navigate('/');
			} catch (e) {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (e.errorId) {
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
						throw e;
				}
			}
		},
		[keystore, navigate, t],
	);

	const onSignup = useCallback(
		async (name) => {
			try {
				try {
					try {
						await api.signupWebauthn(name, keystore);
					} catch (e) {
						console.error("Signup failed", e);
					}

				} catch (e) {
					console.error("Failed to initialize local keystore", e);
				}


				navigate('/');
			} catch (e) {
				// Using a switch here so the t() argument can be a literal, to ease searching
				switch (e.errorId) {
					case 'passkeySignupFailedServerError':
						setError(t('passkeySignupFailedServerError'));
						break;

					case 'passkeySignupFailedTryAgain':
						setError(t('passkeySignupFailedTryAgain'));
						break;

					case 'passkeySignupFinishFailedServerError':
						setError(t('passkeySignupFinishFailedServerError'));
						break;

					default:
						throw e;
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

	const onCancel = () => {
		console.log("onCancel");
		setInProgress(false);
		setIsSubmitting(false);
	};

	return (
		<form onSubmit={onSubmit}>
			{inProgress
				? (
					<>
						<p>Please interact with your authenticator...</p>
						<button
							type="button"
							className="w-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
							onClick={onCancel}
						>
							Cancel
						</button>
					</>
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

						<button
							className="w-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
							type="submit"
							disabled={isSubmitting}
						>
							<GoPasskeyFill className="inline text-xl mr-2" />
							{isSubmitting ? t('submitting') : isLogin ? t('loginPasskey') : t('signupPasskey')}
						</button>
						{error && <div className="text-red-500">{error}</div>}
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

		try {
			if (isLogin) {
				await api.login(username, password, keystore);

			} else {
				await api.signup(username, password, keystore);

			}
			navigate('/');
		} catch (error) {
			setError(
				isLogin ? t('incorrectCredentialsError') : t('usernameExistsError')
			);
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
					<img className="w-20" src={logo} alt="logo" />
				</a>

				<h1 className="text-xl mb-7 font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
				{t('welcomeMessagepart1')} <br /> {t('welcomeMessagepart2')}
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

						{/* <form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
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

						<SeparatorLine>OR</SeparatorLine> */}

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
