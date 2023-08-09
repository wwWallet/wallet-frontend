import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import logo from '../../assets/images/ediplomasLogo.svg';
import { AiOutlineUnlock, AiOutlineLock } from 'react-icons/ai';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component
import { requestForToken } from '../../firebase'; // Adjust the path to your firebase.js file

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

	const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

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

			const isLengthValid = password.length >= 8;
			const hasCapitalLetter = /[A-Z]/.test(password);
			const hasNumber = /[0-9]/.test(password);
			const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

			if (!isLengthValid || !hasCapitalLetter || !hasNumber || !hasSpecialChar) {
				const errorMessages = [];
				const criteriaStyle = 'text-sm';

				errorMessages.push(
					<div>
						<p className="text-red-500 font-bold">{t('weakPasswordError')}</p>
							{!isLengthValid ? (
								<p className="text-red-500">
									<span className={criteriaStyle}>
										<AiOutlineUnlock className="inline-block mr-2" />
										{t('passwordLength')}
									</span>
								</p>
							) : (
								<p className="text-green-500">
									<span className={criteriaStyle}>
										<AiOutlineLock className="inline-block mr-2" />
										{t('passwordLength')}
									</span>
								</p>
							)}
							{!hasCapitalLetter ? (
								<p className="text-red-500">
									<span className={criteriaStyle}>
										<AiOutlineUnlock className="inline-block mr-2" />
										{t('capitalLetter')}
									</span>
								</p>
							) : (
								<p className="text-green-500">
									<span className={criteriaStyle}>
										<AiOutlineLock className="inline-block mr-2" />
										{t('capitalLetter')}
									</span>
								</p>
							)}
							{!hasNumber ? (
								<p className="text-red-500">
									<span className={criteriaStyle}>
										<AiOutlineUnlock className="inline-block mr-2" />
										{t('number')}
									</span>
								</p>
							) : (
								<p className="text-green-500">
									<span className={criteriaStyle}>
										<AiOutlineLock className="inline-block mr-2" />
										{t('number')}
									</span>
								</p>
							)}
							{!hasSpecialChar ? (
								<p className="text-red-500">
									<span className={criteriaStyle}>
										<AiOutlineUnlock className="inline-block mr-2" />
										{t('specialCharacter')}
									</span>
								</p>
							) : (
								<p className="text-green-500">
									<span className={criteriaStyle}>
										<AiOutlineLock className="inline-block mr-2" />
										{t('specialCharacter')}
									</span>
								</p>
							)}
					</div>
				);

				setError(<div>{errorMessages}</div>);
				return;
			}
		}

		setIsSubmitting(true);

		try {
			const response = isLogin ? await loginUser(username, password) : await signupUser(username, password);
			const { appToken } = response;
			Cookies.set('loggedIn', true);
			Cookies.set('username', username);
			Cookies.set('appToken', appToken);

			navigate('/');
		} catch (error) {
			setError(
				isLogin ? t('incorrectCredentialsError') : t('usernameExistsError')
			);
		}

		setIsSubmitting(false);
	};

	const loginUser = async (username, password) => {
		try {
			const response = await axios.post(`${walletBackendUrl}/user/login`, {
				username,
				password,
			});
			return response.data;
		} catch (error) {
			console.error('Failed to log in user', error);
			throw error;
		}
	};

	const signupUser = async (username, password) => {
		const fcm_token = await requestForToken();
		const browser_fcm_token=fcm_token;
		try {
			const response = await axios.post(`${walletBackendUrl}/user/register`, {
				username,
				password,
				fcm_token,
				browser_fcm_token,
			});
			return response.data;
		} catch (error) {
			console.error('Failed to sign up user', error);
			throw error;
		}
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
							{error && <p className="text-red-500">{error}</p>}
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
