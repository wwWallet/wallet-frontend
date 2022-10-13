import axios from 'axios';
import React, { useRef, useState } from 'react';
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { registrationResponseDTO } from '../../interfaces/login-register-dtos';
import { LocationProps } from '../types/LocationProps';
import CustomButton from '../Button/CustomButton';
import RingLoader from "react-spinners/RingLoader";
import Polyglot from 'node-polyglot';
import config from '../../config/config.dev';
import '../Form/Form.css';
import './Register.css'


const override: any = {
	display: "block",
	margin: "0 auto",
	borderColor: "#003476"
};

const ringColor: string = "#003476";

const Register: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const { state } = useLocation() as unknown as LocationProps;
	const navigate = useNavigate();
	const goToWallet = useCallback(() => navigate(state?.path || "/", { replace: true }), [navigate]);

	const passphrase = useRef<HTMLInputElement>(null);
	const [invalidPassword, setInvalidPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);

	async function postToken(pass: string) {
		setLoading(true);
		localStorage.clear();
		await axios.post<registrationResponseDTO>(`${config.storeBackend.url}/user/register`,
			{
				"password": pass
			}
		).then(res => {
			localStorage.setItem("did", res.data.did);
			localStorage.setItem("appToken", res.data.appToken);
			goToWallet();
		})
			.catch(err => {
				setError(true);
			});
	}

	const register = async () => {

		if (passphrase.current != null && passphrase.current.value !== "") {
			var pass: string = passphrase.current.value;
			await postToken(pass);
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


	return (
		<React.Fragment>
			{error &&
				<h1 style={{ color: 'red' }}>Error</h1>
			}
			{loading
				? (
					<div className="gunet-container">
						<div className='recenter'>
							<h2>{polyglot.t('Register.loading')}...</h2>
						</div>
						<RingLoader color={ringColor} loading={true} css={override} size={150} speedMultiplier={0.5} />
					</div>
				)
				: (
					<div className="gunet-container">
						<div className="fade-in-text">
							<h3>{polyglot.t('Register.title')}</h3>
							<p>{polyglot.t('Register.description1')}</p>
							<p>{polyglot.t('Register.description2')}:</p>

							<div className='Form input-group'>
								<input className={invalidPassword ? 'invalid' : ''} id={'passphrase'} type={'password'} ref={passphrase} />
								{invalidPassword &&
									<p className='invalid-feedback'>{polyglot.t('Login.invalidPassword')}</p>
								}
							</div>

							<div style={{ marginTop: '30px' }}>
								<CustomButton buttonDisabled={false} text={polyglot.t('Register.buttonBack')} style={{ borderRadius: "9px" }} onClick={() => navigate('/login')} />
								<CustomButton buttonDisabled={false} text={polyglot.t('Register.buttonRegister')}
									style={{ borderRadius: "9px" }} onClick={register} />
							</div>
						</div>
					</div>
				)
			}
		</React.Fragment>
	);
}

export default Register;
