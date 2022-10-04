import axios from 'axios';
import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginResponseDTO } from '../interfaces/login-register-dtos';
import { LocationProps } from './types/LocationProps';
import './Login.css';
import '../App.css';
import './Form/Form.css';
import './animations.css';
import '../static/gunet/gunet.css';
import Polyglot from 'node-polyglot';
import config from '../config/config.dev';


const Login: React.FC<{ polyglot: Polyglot, handleLanguage(lang: string): void }> = ({ polyglot, handleLanguage }) => {

	const navigate = useNavigate();
	const { state } = useLocation() as unknown as LocationProps;
	const goToWallet = useCallback(() => navigate(state?.path || "/", { replace: true }), [navigate]);

	const passphrase = useRef<HTMLInputElement>(null);
	const [invalidPassword, setInvalidPassword] = useState(false);

	async function authn(passphrase: string) {

		// re-initialize when new login attempt is made
		setInvalidPassword(false);

		await axios.post<loginResponseDTO>(`${config.storeBackend.url}/user/login`,
			{
				"did": window.localStorage.getItem('did'),
				"password": passphrase,
			}
		).then(res => {
			localStorage.setItem("appToken", res.data.appToken);
			goToWallet();
		}
		).catch(err => {
			console.log('Invalid Password');
			handleInvalidPassword();
		});
	}

	const login = async () => {
		if (passphrase.current != null) {
			var pass: string = passphrase.current.value;
			await authn(pass);
		}
		else {
			handleInvalidPassword();
			return;
		}
	};

	const handleInvalidPassword = (timeout = 3000) => {
		setInvalidPassword(true);

		setTimeout(() => {
			setInvalidPassword(false);
		}, timeout);
	}


	const importWallet = async () => {
		navigate('/import', { state: state });
	};

	const register = async () => {
		navigate('/register', { state: state });
	};

	return (
		<div id="home-content">
			<div className="gunet-container">
				<h1>{polyglot.t('Login.header')}</h1>
				<span>{polyglot.t('Login.description1')}</span>
				<div className='login-content'>

					<form className='Form' onSubmit={(e: any) => { e.preventDefault(); login() }}>
						<div className='Group'>
							{polyglot.t('Login.description2')}
							<div className='input-group'>
								<div className='passphrase-input-field'>
									<input className={invalidPassword ? 'invalid' : ''} id={'passphrase'} type={'password'} ref={passphrase} />
								</div>
								{invalidPassword &&
									<p className='invalid-feedback'>{polyglot.t('Login.invalidPassword')}</p>
								}
							</div>
						</div>
					</form>

					<button
						className="ui fancy button"
						onClick={login}>
						{polyglot.t('Login.buttonLogin')}
					</button>
					<button
						className="yellow-button fancy button"
						onClick={register}>
						{polyglot.t('Login.buttonRegister')}
					</button>
					<button
						className="grey-button fancy button"
						onClick={importWallet}>
						{polyglot.t('Login.buttonImport')}
					</button>

				</div>
			</div>
		</div>
	);
}

export default Login;