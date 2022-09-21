import axios from 'axios';
import React, { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import Button from './Button/Button';
import { FuncProps } from '../interfaces/FuncProps';
import { loginResponseDTO } from '../interfaces/login-register-dtos';
import { LocationProps } from './types/LocationProps';
import CustomButton from './Button/CustomButton';
import { Spinner } from './Spinner';
import {Form, FormGroup, InputGroup, TextInput} from './Form/Form';
import './Login.css';
import '../App.css';
import './animations.css';
import '../static/gunet/gunet.css';
import Polyglot from 'node-polyglot';
import LanguageSwitch from './LanguageSwitch';
const POST_URL = `/user-wallet-auth/login`;
const AUTH_URL = `/op/auth`;


const Login: React.FC<{polyglot: Polyglot, handleLanguage(lang: string): void}> = ({polyglot, handleLanguage}) => {
  const passphrase = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { state } = useLocation() as unknown as LocationProps;
  const goToWallet = useCallback(() => navigate(state?.path || "/", {replace: true}), [navigate]);
  const [loading, setLoading] = useState(false);

  const [hasWrongPassoword, setHasWrongPassword] = useState(false);

  async function authn(passphrase: string) {
    setHasWrongPassword(false); // re initialize when new login attempt is made
    setLoading(true);
    await axios.post<loginResponseDTO>(POST_URL,{
        "did": window.localStorage.getItem('did'),
        "password": passphrase,
    }).then(res => {
            console.log(res);
            // console.log(res.data);
            localStorage.setItem("ebsi_token", res.data.ebsi_access_token);
            localStorage.setItem("apptoken", res.data.apptoken);
            setLoading(false);
            goToWallet();
      })
      .catch(err => {
        console.log('err = ', err);
          setHasWrongPassword(true);
          setLoading(false);
      });
  }
  const login = async () => {
    let pass_elem = document.getElementById('passphrase') as any; //passphrase.current?.value;
    let pass = pass_elem.value ? pass_elem.value : "";
    console.log('pass = ', pass)
    if (pass === undefined || pass === "" || pass === null) {
      setHasWrongPassword(true);
      return;
    }
    await authn(pass);
  };

  const importWallet = async () => {
    // In the case where user is redirected to /login
    // but the user selects to import an existing wallet (/import route)
    // then the state must be stored
    navigate('/import', {state: state});
  };

  const register = async () => {
    // In the case where user is redirected to /login
    // but the user selects to create a new wallet (/register route)
    // then the state must be stored
    navigate('/register', {state: state});
  };
  return (
    <React.Fragment>
      <LanguageSwitch
        polyglot={polyglot}
        handleLanguage={handleLanguage}
      />
      <div id = "home-content">
        <div className = "gunet-container">
          <h1>{polyglot.t('Login.header')}</h1>
          <span>{polyglot.t('Login.description1')}</span>
          <div>
          &nbsp; &nbsp; &nbsp;

            {/* <Button text = "Use an existing Wallet" functionCall = {onUseExistingWallet}/> */}
            <Form>
              <FormGroup>
              <div>
              {polyglot.t('Login.description2')}
                
                </div>
                <InputGroup className="mb-3" style={{width: '50%'}}>

                <div className='passphrase-input-field'>
                  <TextInput id="passphrase" type="password" />
                </div>

                </InputGroup>
              </FormGroup>

              
            </Form>

              {/* </InputGroup.Text>
              <FormControl isInvalid={hasWrongPassoword} ref={passphrase} type="password" id="passphrase" aria-describedby="basic-addon3" style={{"width": "5%", "minWidth": "200px"}}/>
            </InputGroup>
            <CustomButton buttonDisabled={false} text="Login with existing wallet" onClick={login} >
              {loading ? <Spinner className="spinner" cx={20} cy={12} r={9} /> : <></>}
            </ CustomButton>
            <br/>
            <Button onClick={register} variant="light" style={{marginTop: '10px'}}>
              Create a new wallet
            </Button>
            <Button onClick={importWallet} variant="light" style={{marginTop: '10px'}}>
              Import existing wallet
            </Button> */}
              <button
                  className="ui fancy button"
                  onClick={login}>
                  {polyglot.t('Login.buttonLogin')} {' '}
                  {/* <span className="fa fa-arrow-right" /> */}
                </button>

                <button
                  className="yellow-button fancy button"
                  onClick={register}>
                  {polyglot.t('Login.buttonRegister')} {' '}
                  {/* <span className="fa fa-arrow-right" /> */}
                </button>
                <button
                  className="grey-button fancy button"
                  onClick={importWallet}>
                  {polyglot.t('Login.buttonImport')} {' '}
                  {/* <span className="fa fa-arrow-right" /> */}
                </button>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default Login;