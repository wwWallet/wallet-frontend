import axios from 'axios';
import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LocationProps } from '../types/LocationProps';
import { registrationResponseDTO } from '../../interfaces/login-register-dtos';
import Polyglot from 'node-polyglot';
import Authguard from '../Authguard/Authguard';
import config from '../../config/config.dev';
import { RegisterErrors } from '../types/RegisterErrors';
import CustomButton from '../Button/CustomButton';
import '../Form/Form.css';
import './Register.css'

const Register: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const { state } = useLocation() as unknown as LocationProps;
	const navigate = useNavigate();
	const goToWallet = useCallback(() => navigate(state?.path || "/", { replace: true }), [navigate]);

	const usernameField = useRef<HTMLInputElement>(null);
	const passwordField = useRef<HTMLInputElement>(null);
	const passwRptField = useRef<HTMLInputElement>(null);
	const [error, setError] = useState<RegisterErrors>('');

	async function register(username: string, passwordField: string, passwRptField: string) {

		// re-initialize errors when new login attempt is made
		setError('');
		localStorage.clear();

		await axios.post<registrationResponseDTO>(`${config.storeBackend.url}/user/register`,
			{
				"username": username,
				"password": passwordField,
				"repeatpw": passwRptField
			}
		).then(res => {
			localStorage.setItem("did", res.data.did);
			localStorage.setItem("appToken", res.data.appToken);
			goToWallet();
		}
		).catch(error => {
			try {
				if (error.response.data.err === 'USERNAME_ALREADY_EXISTS')
					handleError('existingUsername');
				else
					handleError('networkError');
			}
			catch {
				handleError('networkError');
			}
		});
	}

	const handleRegister = async () => {

		if (usernameField.current == null || usernameField.current.value === "") {
			handleError('emptyUsername');
			return;
		}
		if (passwordField.current == null || passwordField.current.value === "") {
			handleError('emptyPassword');
			return;
		}
		if (passwRptField.current == null || passwRptField.current.value === "") {
			handleError('emptyRepeatPassword');
			return;
		}
		if (passwordField.current.value !== passwRptField.current.value) {
			handleError('differentPasswords');
			return;
		}

		var username: string = usernameField.current.value;
		var password: string = passwordField.current.value;
		var passwRpt: string = passwRptField.current.value;
		await register(username, password, passwRpt);
	};

	const goBack = async () => {
		navigate('/login', { state: state });
	};

	const handleError = (error: RegisterErrors, timeout = 3000) => {
		setError(error);

		setTimeout(() => {
			setError('');
		}, timeout);
	}


	return (
		<div className="gunet-container">
			<div className="fade-in-text">
				<div id="Form">
					<div className="form-flex">
						<form onSubmit={(e: any) => { e.preventDefault(); handleRegister() }} className="form-flex form-box item">

							<h1 className="title item">
								{polyglot.t('Register.title')}
							</h1>
							<p className="subtitle">
								{polyglot.t('Register.description1')}
							</p>
							<p className="item">
								{polyglot.t('Register.description2')}
							</p>

							<div className={`input-wrap item ${error.includes('Username') || error.includes('Credentials') ? 'invalid' : ''}`}>
								<input className={'input-field'} id={'username'} type={'text'} placeholder={'Username'} ref={usernameField} />
							</div>
							<div className={`input-wrap item ${error.includes('Password') || error.includes('Credentials') ? 'invalid' : ''}`}>
								<input className={'input-field'} id={'password'} type={'password'} placeholder={'Password'} ref={passwordField} />
							</div>
							<div className={`input-wrap item ${error.includes('Password') || error.includes('Credentials') ? 'invalid' : ''}`}>
								<input className={'input-field'} id={'password-rpt'} type={'password'} placeholder={'Repeat password'} ref={passwRptField} />
							</div>
							{error &&
								<p className='invalid-feedback'>{polyglot.t(`Register.error.${error}`)}</p>
							}

							<div id="buttons" className="item" style={{ marginTop: '30px' }}>
								<button type="button" className="small login-button grey-button ui fancy button" onClick={goBack}>
									{polyglot.t('Register.buttonBack')}
								</button>
								<CustomButton type={'submit'} text={polyglot.t('Register.buttonRegister')} />
							</div>

						</form>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Authguard(Register, null);
