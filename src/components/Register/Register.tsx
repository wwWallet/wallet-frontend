import axios from 'axios';
import React, { CSSProperties, useRef, useState } from 'react';
import {useCallback} from 'react';
import {useNavigate, useLocation, useSearchParams} from 'react-router-dom';
import { registrationResponseDTO } from '../../interfaces/login-register-dtos';
import { LocationProps } from '../types/LocationProps';
import { FuncProps } from '../../interfaces/FuncProps';
import { Alert, Button, FormControl, InputGroup } from 'react-bootstrap';
import CustomButton from '../Button/CustomButton';
import './Register.css'
import { Spinner } from '../Spinner';
import RingLoader from "react-spinners/RingLoader";
import Polyglot from 'node-polyglot';

const POST_URL = `/user-wallet-auth/register`;

function openURL() {
    console.log('Open EBSI page to get token');
    window.open("https://app.preprod.ebsi.eu/users-onboarding");
}
const override: any = {
    display: "block",
    margin: "0 auto",
    borderColor: "#003476"
  };
const Register: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {
    let [color, setColor] = useState("#003476");

    const token = useRef<HTMLInputElement>(null);
    const password = useRef<HTMLInputElement>(null);

    const [tokenIsEmpty, setTokenIsEmpty] = useState<boolean>(false);
    const [passwordIsEmpty, setPasswordIsEmpty] = useState<boolean>(false); 

    const { state } = useLocation() as unknown as LocationProps;
    const navigate = useNavigate();
    const goToWallet = useCallback(() => navigate(state?.path || "/", {replace: true}), [navigate]);
    const [loading, setLoading] = useState(false);
    
    const [searchParams, setSearchParams] = useSearchParams();

    async function postToken() {
        setLoading(true);
        localStorage.clear();
        await axios.post<registrationResponseDTO>(POST_URL,{ "eosToken": eosToken, "password": password.current?.value}
            ).then(res => {
                console.log(res);
                localStorage.setItem("did", res.data.did);
                localStorage.setItem("ebsi_token", res.data.ebsi_access_token);
                localStorage.setItem("apptoken", res.data.apptoken);
                localStorage.removeItem("vc_wallet");
                goToWallet();
        })
        .catch(err => {
            window.location.href = '/register?invalid_eos_token=true'; // re-render the /register route (don't use Navigate here)
        });
    }



    const [vis, setVis] = useState<Object>({opacity: '0', transition: '0.8s' });

    const [giveToken, setGiveToken] = useState<boolean>(true);

    const [eosToken, setEosToken] = useState<string | undefined>("");

    return (
        <React.Fragment>
        {loading ? (
            <div className = "gunet-container">
                    <div className='recenter'>
                        <h2>{polyglot.t('Register.loading')}...</h2>
                    </div>
                    <RingLoader color={color} loading={true} css={override} size={150} speedMultiplier={0.5} />

            </div>
            ) : 
            (
            <div className = "gunet-container">
                {(searchParams.get('invalid_eos_token') == 'true') ? <Alert style={{marginBottom: '60px'}}  variant='danger'>Error: EOS token is invalid </Alert>: <></>}

                {giveToken ? (
                    <div>
                        <div>
                            <h3 style={{marginBottom: '10px'}}>{polyglot.t('Register.step1.title')}</h3>
                            <p>{polyglot.t('Register.step1.description1')}</p>
                            <button
                                className="yellow-button login-button ui fancy button"
                                onClick={openURL}>
                                {polyglot.t('Register.step1.buttonEOS')} {' '}
                            </button>
                            <h4>{polyglot.t('Register.step1.description2')}:</h4>
                            &nbsp;
                            <InputGroup className="mb-3" style={{width: '50%'}}>
                                <InputGroup.Text  id="basic-addon3">
                                    {polyglot.t('Register.step1.token')}
                                </InputGroup.Text>
                                <FormControl isInvalid={tokenIsEmpty} ref={token} aria-describedby="basic-addon3" style={{"width": "5%", "minWidth": "200px"}}/>
                            </InputGroup>
                        </div>
                        <button
                                className="small login-button ui fancy button"
                                onClick={() => {
                                    if (token.current != null && token.current.value.length == 0) {
                                        setTokenIsEmpty(true);
                                        return;
                                    }
                                    setTokenIsEmpty(false);
                                    setGiveToken(false); 
                                    setEosToken(token.current?.value) 
                                } }>
                                {polyglot.t('Register.step1.buttonToken')} {' '}
                        </button>


                    </div>
                ) : (
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
                            {/* <Button style={{borderRadius: "9px"}} onClick={() => navigate('/login')}>
                                Back
                            </Button> */}
                            <CustomButton buttonDisabled={false} text={polyglot.t('Register.step2.buttonBack')} style={{borderRadius: "9px"}} onClick={() => navigate('/login')} />
                            &nbsp; &nbsp; &nbsp;
                            {/* {contButton()} */}
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
                )}



            </div>
        )}
    </React.Fragment>
    );
}

export default Register;
