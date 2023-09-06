import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import { GoPasskeyFill } from 'react-icons/go';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook

import * as api from '../../api';
import { toBase64Url } from '../../util';
import logo from '../../assets/images/ediplomasLogo.svg';
import LanguageSelector from '../../components/LanguageSelector/LanguageSelector'; // Import the LanguageSelector component


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

const FormInputField = ({
	ariaLabel,
	name,
	onChange,
	placeholder,
	value,
	type,
}) => {
	return (
		<div className="relative">
			<input
				className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				type={type || "text"}
				name={name}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				aria-label={ariaLabel}
			/>
		</div>
	);
};

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

	useEffect(
		() => {
			setError("");
		},
		[isLogin],
	);

	const onLogin = useCallback(
		async () => {
			try {
				const beginResp = await api.post('/user/login-webauthn-begin', {});
				console.log("begin", beginResp);
				const beginData = beginResp.data;

				try {
					const credential = await navigator.credentials.get(beginData.getOptions);
					console.log("asserted", credential);

					try {
						const finishResp = await api.post('/user/login-webauthn-finish', {
							challengeId: beginData.challengeId,
							credential: {
								type: credential.type,
								id: credential.id,
								rawId: credential.id,
								response: {
									authenticatorData: toBase64Url(credential.response.authenticatorData),
									clientDataJSON: toBase64Url(credential.response.clientDataJSON),
									signature: toBase64Url(credential.response.signature),
									userHandle: toBase64Url(credential.response.userHandle),
								},
								authenticatorAttachment: credential.authenticatorAttachment,
								clientExtensionResults: credential.getClientExtensionResults(),
							},
						});
						api.setSessionCookies(finishResp);
						navigate('/');
					} catch (e) {
						setError(t('passkeyInvalid'));
					}

				} catch (e) {
					setError(t('passkeyLoginFailedTryAgain'));
				}

			} catch (e) {
				setError(t('passkeyLoginFailedServerError'));
			}
		},
		[navigate, t],
	);

	const onSignup = useCallback(
		async (name) => {
			try {
				const beginResp = await api.post('/user/register-webauthn-begin', {});
				console.log("begin", beginResp);
				const beginData = beginResp.data;

				try {
					const credential = await navigator.credentials.create({
						...beginData.createOptions,
						publicKey: {
							...beginData.createOptions.publicKey,
							user: {
								...beginData.createOptions.publicKey.user,
								name,
								displayName: name,
							},
						},
					});
					console.log("created", credential);

					try {
						const finishResp = await api.post('/user/register-webauthn-finish', {
							challengeId: beginData.challengeId,
							displayName: name,
							credential: {
								type: credential.type,
								id: credential.id,
								rawId: credential.id,
								response: {
									attestationObject: toBase64Url(credential.response.attestationObject),
									clientDataJSON: toBase64Url(credential.response.clientDataJSON),
									transports: credential.response.getTransports(),
								},
								authenticatorAttachment: credential.authenticatorAttachment,
								clientExtensionResults: credential.getClientExtensionResults(),
							},
						});
						api.setSessionCookies(finishResp);
						navigate('/');
					} catch (e) {
						setError(t('passkeySignupFailedServerError'));
					}

				} catch (e) {
					setError(t('passkeySignupFailedTryAgain'));
				}

			} catch (e) {
				setError(t('passkeySignupFinishFailedServerError'));
			}
		},
		[navigate, t],
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
							className="w-full text-gray-700 bg-gray-50 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
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
							className="w-full text-gray-700 bg-gray-50 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex flex-row flex-nowrap items-center justify-center"
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

	const [isLogin, setIsLogin] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const toggleForm = (event) => {
		event.preventDefault();
		setIsLogin(!isLogin);
	};

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
