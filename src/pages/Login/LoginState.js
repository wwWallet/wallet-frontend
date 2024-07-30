import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaInfoCircle, FaLock, FaUser } from 'react-icons/fa';
import { GoPasskeyFill } from 'react-icons/go';
import { Trans, useTranslation } from 'react-i18next';
import { CSSTransition } from 'react-transition-group';
import OnlineStatusContext from '../../context/OnlineStatusContext';
import { useApi } from '../../api';
import { useLocalStorageKeystore } from '../../services/LocalStorageKeystore';
import logo from '../../assets/images/logo.png';
import GetButton from '../../components/Buttons/GetButton';
import { PiWifiHighBold, PiWifiSlashBold } from "react-icons/pi";

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
			<IconComponent className="absolute left-3 top-10 z-10 text-gray-500 dark:text-white" />
			{label}
		</label>
		{children}
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


const WebauthnSignupLogin = ({
	isLogin,
	isSubmitting,
	setIsSubmitting,
	filteredUser,
}) => {
	const { isOnline } = useContext(OnlineStatusContext);

	const api = useApi(isOnline);
	const [inProgress, setInProgress] = useState(false);
	const [error, setError] = useState('');
	const [needPrfRetry, setNeedPrfRetry] = useState(false);
	const [resolvePrfRetryPrompt, setResolvePrfRetryPrompt] = useState(null);
	const [prfRetryAccepted, setPrfRetryAccepted] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();
	const from = location.state?.from || '/';

	const { t } = useTranslation();
	const keystore = useLocalStorageKeystore();
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

	const onSubmit = async (event) => {
		event.preventDefault();

		setError();
		setInProgress(true);
		setIsSubmitting(true);

		await onLogin();

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

	return (
		<form onSubmit={onSubmit}>
			<>
				<ul className=" p-2">
					{filteredUser && (
						<div className='flex flex-row gap-4 justify-center mr-2'>
							<GetButton
								content={
									<>
										{isSubmitting ? t('loginSignup.submitting') : t('common.cancel')}
									</>
								}
								onClick={() => onLoginCachedUser(filteredUser)}
								variant="cancel"
								disabled={isSubmitting}
								additionalClassName='w-full'
							/>
							<GetButton
								content={
									<>
										<GoPasskeyFill className="inline text-xl mr-2" />
										{isSubmitting ? t('loginSignup.submitting') : t('common.continue')}
									</>
								}
								onClick={() => onLoginCachedUser(filteredUser)}
								variant="primary"
								disabled={isSubmitting}
								additionalClassName='w-full'
							/>
						</div>
					)}
				</ul>
				{error && <div className="text-red-500 pt-4">{error}</div>}
			</>
		</form>
	);
};

const Login = () => {
	const { isOnline } = useContext(OnlineStatusContext);
	const api = useApi(isOnline);
	const { t } = useTranslation();
	const location = useLocation();

	const [formData, setFormData] = useState({
		username: '',
		password: '',
		confirmPassword: '',
	});
	const [error, setError] = useState('');
	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isContentVisible, setIsContentVisible] = useState(false);
	const [filteredUser, setFilteredUser] = useState(null);
	const navigate = useNavigate();
	const keystore = useLocalStorageKeystore();
	const cachedUsers = keystore.getCachedUsers();
	console.log('cachedUsers', cachedUsers)
	const from = location.state?.from;
	console.log('from:', from)

	useEffect(() => {
		const queryParams = new URLSearchParams(from.search);
		const state = queryParams.get('state');

		if (state) {
			try {
				console.log('state', state)
				const decodedState = atob(state);
				const stateObj = JSON.parse(decodedState);
				setFilteredUser(cachedUsers.find(user => user.userHandleB64u === stateObj.userHandleB64u));
			} catch (error) {
				console.error('Error decoding state:', error);
			}
		}
	}, [location.search]);

	useEffect(() => {
		if (api.isLoggedIn()) {
			navigate('/');
		}
	}, [api, navigate]);

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
		setIsSubmitting(true);

		const result = await api.login(username, password, keystore);
		if (result.ok) {
			navigate(from, { replace: true });
		} else {
			setError(t('loginSignup.incorrectCredentialsError'));
		}

		setIsSubmitting(false);
	};

	useEffect(() => {
		setIsContentVisible(true);
	}, []);

	return (
		<section className="bg-gray-100 dark:bg-gray-900 h-full">

			<CSSTransition in={isContentVisible} timeout={400} classNames="content-fade-in">
				<>
					<div className='h-max min-h-screen'>
						<div className="flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-[95vh]">
							<a href="/" className="flex justify-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
								<img className="w-40" src={logo} alt="logo" />
							</a>

							<h1 className="text-3xl mb-7 font-bold leading-tight tracking-tight text-gray-900 text-center dark:text-white">
								<Trans
									i18nKey="loginState.welcomeBackMessage"
									components={{
										highlight: <span className="text-primary dark:text-primary-light" />
									}}
								/>
							</h1>

							<div className="relative w-full md:mt-0 sm:max-w-md xl:p-0">
								<div className="relative p-6 space-y-4 md:space-y-6 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
									{filteredUser && (
										<h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl text-center dark:text-white">
											{t('loginState.title')} {filteredUser.displayName}
										</h1>
									)}
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
									<p className="text-sm text-gray-600 dark:text-gray-200 mb-2">
										<Trans
											i18nKey="loginState.message"
											components={{ strong: <strong /> }}
										/>
									</p>

									{(loginWithPassword) ?
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
												</FormInputRow>


												<GetButton
													type="submit"
													content={isSubmitting ? t('loginSignup.submitting') : t('loginSignup.login')}
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
										isLogin={true}
										isSubmitting={isSubmitting}
										setIsSubmitting={setIsSubmitting}
										filteredUser={filteredUser}
									/>

								</div>
							</div>
						</div>
						<div className='h-[5vh]'>
							<p className='text-gray-700 dark:text-gray-400 text-center min-mt-10'>
								<Trans
									i18nKey="sidebar.poweredBy"
									components={{
										docLinkWalletGithub: <a
											href="https://github.com/wwWallet" rel="noreferrer" target='blank_' className="underline text-primary dark:text-primary-light"
										/>
									}}
								/>
							</p>
							<p className='bg-gray-100 dark:bg-gray-900 text-gray-100 dark:text-gray-900'>{process.env.REACT_APP_VERSION}</p>

						</div>
					</div>
				</>
			</CSSTransition>
		</section>
	);
};

export default Login;
