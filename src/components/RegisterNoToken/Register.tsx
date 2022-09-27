import axios from 'axios';
import React, { useRef, useState } from 'react';
import {useCallback} from 'react';
import {useNavigate, useLocation } from 'react-router-dom';
import { registrationResponseDTO } from '../../interfaces/login-register-dtos';
import { LocationProps } from '../types/LocationProps';
import { FormControl, InputGroup } from 'react-bootstrap';
import CustomButton from '../Button/CustomButton';
import './Register.css'
import RingLoader from "react-spinners/RingLoader";
import Polyglot from 'node-polyglot';
import config from '../../config/config.dev';

// const POST_URL = `/user-wallet-auth/register`;

const override: any = {
    display: "block",
    margin: "0 auto",
    borderColor: "#003476"
};

const ringColor: string = "#003476";

const Register: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const password = useRef<HTMLInputElement>(null);

    const [passwordIsEmpty, setPasswordIsEmpty] = useState<boolean>(false); 

    const { state } = useLocation() as unknown as LocationProps;
    const navigate = useNavigate();
    const goToWallet = useCallback(() => navigate(state?.path || "/", {replace: true}), [navigate]);
    const [loading, setLoading] = useState(false);
    
    async function postToken() {
        setLoading(true);
        localStorage.clear();
        await axios.post<registrationResponseDTO>(config.backend.url+'/user/register',{"password": password.current?.value}
            ).then(res => {
                console.log(res);
                localStorage.setItem("did", res.data.did);
                localStorage.setItem("appToken", res.data.appToken);
                goToWallet();
        })
        .catch(err => {
            console.log('err: ', err);
            window.location.href = '/register?error=true'; // re-render the /register route (don't use Navigate here)
        });
    }




    return (
        <React.Fragment>
        {loading ? (
            <div className = "gunet-container">
                    <div className='recenter'>
                        <h2>{polyglot.t('Register.loading')}...</h2>
                    </div>
                    <RingLoader color={ringColor} loading={true} css={override} size={150} speedMultiplier={0.5} />

            </div>
            ) : 
            (
            <div className = "gunet-container">

                    <div className="fade-in-text">

                        <div>
                            <h3>{polyglot.t('Register.step2.title')}</h3>
                                <p>{polyglot.t('Register.step2.description1')}</p>
                            <p>{polyglot.t('Register.step2.description2')}:</p>
                            &nbsp;
                            <InputGroup className="mb-3" style={{width: '50%'}}>
                                <InputGroup.Text  id="basic-addon3">
                                {polyglot.t('Register.step2.passphrase')}
                                </InputGroup.Text>
                                <FormControl isInvalid={passwordIsEmpty} ref={password} type='password' aria-describedby="basic-addon3" style={{"width": "5%", "minWidth": "200px"}}/>
                            </InputGroup>
                        </div>
                        <div style={{marginTop: '30px'}}>
                            <CustomButton buttonDisabled={false} text={polyglot.t('Register.step2.buttonBack')} style={{borderRadius: "9px"}} onClick={() => navigate('/login')} />
                            &nbsp; &nbsp; &nbsp;
                            <CustomButton buttonDisabled={false} text={polyglot.t('Register.step2.buttonRegister')} style={{borderRadius: "9px"}} onClick={() => {
                                if (password.current != null && password.current.value.length == 0) {
                                    setPasswordIsEmpty(true);
                                    return;
                                }
                                setPasswordIsEmpty(false);
                                postToken();
                            }} />

                        </div>
                    <div>
                    </div>
                    </div>

            </div>
        )}
    </React.Fragment>
    );
}

export default Register;
