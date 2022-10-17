import axios from 'axios';
import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocationProps } from '../types/LocationProps';
import { loginResponseDTO } from '../../interfaces/login-register-dtos';
import Polyglot from 'node-polyglot';
import Authguard from '../Authguard/Authguard';
import config from '../../config/config.dev';
import { LoginErrors } from '../types/LoginErrors';
import './Login.css';
import '../../App.css';
import '../Form/Form.css';

const Login: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const navigate = useNavigate();
	const { state } = useLocation() as unknown as LocationProps;
	const goToWallet = useCallback(() => navigate(state?.path || "/", { replace: true }), [navigate]);

	const usernameField = useRef<HTMLInputElement>(null);
	const passwordField = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<LoginErrors>('');

	async function login(username: string, password: string) {

		// re-initialize errors when new login attempt is made
		setError('');

		await axios.post<loginResponseDTO>(`${config.storeBackend.url}/user/login`,
			{
				"username": username,
				"password": password,
			}
		).then(res => {
			localStorage.setItem("appToken", res.data.appToken);
			goToWallet();
		}
		).catch(error => {
			try {
				if(error.response.data.err === 'INVALID_CREDENTIALS') 
					handleError('invalidCredentials');
				else
					handleError('networkError');
			}
			catch {
				handleError('networkError');
			}
		});
	}

	const handleLogin = async () => {

		if (usernameField.current == null || usernameField.current.value === "") {
			handleError('emptyUsername');
			return;
		}
		if (passwordField.current == null || passwordField.current.value === "") {
			handleError('emptyPassword');
			return;
		}
		var username: string = usernameField.current.value;
		var password: string = passwordField.current.value;
		await login(username, password);
	};

	const importWallet = async () => {
		navigate('/import', { state: state });
	};

	const register = async () => {
		navigate('/register', { state: state });
	};


	const handleError = (error: LoginErrors, timeout = 3000) => {
		setError(error);

		setTimeout(() => {
			setError('');
		}, timeout);
	}


	return (
		<div id="home-content">
			<div className="gunet-container">
				<div className='login-content'>
					<div id="Form">
						<div className="form-flex">
							<form onSubmit={(e: any) => { e.preventDefault(); handleLogin() }} className="form-flex form-box item">

								<h1 className="title item">
									{polyglot.t('Login.header')}
								</h1>

								<p className="subtitle">
									{polyglot.t('Login.description1')}
								</p>
								<p className="item">
									{polyglot.t('Login.description2')}
								</p>

								<div className={`input-wrap item ${error.includes('Username') || error.includes('Credentials') ? 'invalid' : ''}`}>
									<input className={'input-field'} id={'username'} type={'text'} placeholder={'Username'} ref={usernameField} />
								</div>
								<div className={`input-wrap item ${error.includes('Password') || error.includes('Credentials') ? 'invalid' : ''}`}>
									<input className={'input-field'} id={'password'} type={'password'} placeholder={'password'} ref={passwordField} />
								</div>
								{error &&
									<p className='invalid-feedback'>{polyglot.t(`Login.error.${error}`)}</p>
								}

								<div id="buttons" className="item">
									<button type="submit" className="small login-button ui fancy button">
										{polyglot.t('Login.buttonLogin')}
									</button>
									<button type="button" className="small login-button yellow-button ui fancy button" onClick={register}>
										{polyglot.t('Login.buttonRegister')}
									</button>
									<button type="button" className="small login-button grey-button ui fancy button" onClick={importWallet}>
										{polyglot.t('Login.buttonImport')}
									</button>
								</div>

							</form>
						</div>
					</div>
				</div>
			</div>
		</div >
	);
}

export default Authguard(Login, null);