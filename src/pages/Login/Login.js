import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { AiOutlineUnlock } from 'react-icons/ai';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook

import * as api from '../../api';
import { useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import logo from '../../assets/images/ediplomasLogo.svg';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../../util';


const PasswordCriterionMessage = ({ text, ok }) => (
	<p className={ok ? "text-green-500" : "text-red-500"}>
		<span className="text-sm">
			<AiOutlineUnlock className="inline-block mr-2" />
			{text}
		</span>
	</p>
);

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
				const response = await api.login(username, password);
				const { pbkdf2Params, privateData } = response;
				try {
					const encryptionKey = await keystore.unlockPassword(password, jsonParseTaggedBinary(pbkdf2Params));
					await keystore.unlock(encryptionKey, privateData);
				} catch (e) {
					console.error("Failed to unlock local keystore", e);
				}

			} else {
				try {
					const { pbkdf2Params, publicData, privateData } = await keystore.init(password);
					try {
				    await api.signup(username, password, publicData, jsonStringifyTaggedBinary(pbkdf2Params), privateData);
					} catch (e) {
						console.error("Signup failed", e);
					}

				} catch (e) {
					console.error("Failed to initialize local keystore", e);
				}
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

	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const toggleConfirmPasswordVisibility = () => {
		setShowConfirmPassword(!showConfirmPassword);
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
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
		<section className="bg-gray-100 dark:bg-gray-900">
			<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen pb-20">
				<a href="/" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
					<img className="w-20" src={logo} alt="logo" />
				</a>

				<h1 className="text-xl mb-7 font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
				{t('welcomeMessagepart1')} <br /> {t('welcomeMessagepart2')}
				</h1>

				<div className="relative w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
					{/* Dropdown to change language */}
					<div className="absolute top-2 right-2">
						<LanguageSelector />
					</div>

					<div className="p-6 space-y-4 md:space-y-6 sm:p-8">
						<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
							{isLogin ? t('login') : t('signUp')}
						</h1>

						<form className="space-y-4 md:space-y-6" onSubmit={handleFormSubmit}>
							{error && <div className="text-red-500">{error}</div>}
							<div className="mb-4 relative">
								<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
									<FaUser className="absolute left-3 top-10 z-10 text-gray-500" />
									{t('usernameLabel')}
								</label>
								<input
									className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									id="username"
									type="text"
									name="username"
									placeholder={t('enterUsername')}
									value={username}
									onChange={handleInputChange}
									aria-label="Username"
								/>
							</div>

							<div className="mb-6 relative">
								<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
									<FaLock className="absolute left-3 top-10 z-10 text-gray-500" />
									{t('passwordLabel')}
								</label>
								<div className="relative">
									<input
										className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
										id="password"
										type={showPassword ? 'text' : 'password'}
										name="password"
										placeholder={t('enterPassword')}
										value={password}
										onChange={handleInputChange}
										aria-label="Password"
									/>
									<div className="absolute inset-y-0 right-3 flex items-center">
										<button
											type="button"
											onClick={togglePasswordVisibility}
											className="text-gray-500 focus:outline-none"
										>
											{showPassword ? <FaEyeSlash /> : <FaEye />}
										</button>
									</div>
								</div>
								{!isLogin && password !== '' && (
									<div className="flex items-center mt-1">
										<p className="text-sm text-gray-600 mr-2">{t('strength')}</p>
										<div className="flex flex-1 h-4 bg-lightgray rounded-full border border-gray-300">
											<div
												className={`h-full rounded-full ${
													passwordStrength < 50
														? 'bg-red-500'
														: passwordStrength >= 50 && passwordStrength < 100
														? 'bg-yellow-500'
														: 'bg-green-500'
												}`}
												style={{ width: `${passwordStrength}%` }}
											></div>
										</div>
									</div>
								)}
							</div>

							{!isLogin && (
								<div className="mb-6 relative">
									<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
										<FaLock className="absolute left-3 top-10 z-10 text-gray-500" />
										{t('confirmPasswordLabel')}
									</label>
									<div className="relative">
										<input
											className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
											id="confirm-password"
											type={showConfirmPassword ? 'text' : 'password'}
											name="confirmPassword"
											placeholder={t('enterconfirmPasswordLabel')}
											value={confirmPassword}
											onChange={handleInputChange}
											aria-label="Confirm Password"
										/>
										<div className="absolute inset-y-0 right-3 flex items-center">
											<button
												type="button"
												onClick={toggleConfirmPasswordVisibility}
												className="text-gray-500 focus:outline-none"
											>
												{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
											</button>
										</div>
									</div>
								</div>
							)}

							<button
								className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								type="submit"
								disabled={isSubmitting}
							>
								{isSubmitting ? t('submitting') : isLogin ? t('login') : t('signUp')}
							</button>

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
						</form>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Login;
