

import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {useCallback} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../Button/CustomButton';
import CredentialList from '../CredentialList/CredentialList';
import decode from 'jwt-decode';
import { Card } from 'react-bootstrap';
import CustomButton from '../Button/CustomButton';
import Spinner from '../Spinner/Spinner';
import DatePicker from "react-datepicker";
import Polyglot from 'node-polyglot';

const CREATE_PRESENTATION_ENDPOINT = `/op/present`; 
const ACCESS_TOKEN_ENDPOINT = `/at`;
export interface VerificationResponseI {
  redirect_status_url: string;
}
const Present: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

  const [searchParams, setSearchParams] = useSearchParams();
  const name: string = searchParams.get("name") as string;
  const verifierUrl: string = searchParams.get("verifier") as string;
  const audience: string = searchParams.get("aud") as string;
  const navigate = useNavigate();

	const [credentials, setCredentials] = useState<any[]>([]);

  const [selectedSet, setSelectedSet] = useState<any[]>([]);

  const [selectedSetLength, setSelectedSetLength] = useState<number>(0);

  const [disabledButton, setDisabledButton] = useState(true);

  const [IssuerName, setName] = useState("None");
  const [loading, setLoading] = useState(false);

	const [expirationDate, setExpirationDate] = useState(new Date());
  const [credentialsAreLoaded, setCredentialsAreLoaded] = useState<boolean>(false);

  useEffect(() => {
    console.log('New expiration date = ', expirationDate.toISOString())
  }, [expirationDate]);


  useEffect(() => {
    console.log(selectedSet.length);

    console.log("triggered", selectedSet.length)
    if((selectedSetLength !== 0)){
        setDisabledButton(false);
    }else{
        setDisabledButton(true);
    }
  },[selectedSetLength]);

	useEffect(() => {
    setName(name);
		// load credentials from db
		axios.post(`/get-by-did`,
    { ebsi_token: localStorage.getItem('ebsi_token') },
    { headers : {
			Authorization: `Bearer ${localStorage.getItem('appToken')}`
		}})
    .then(res => {
			const array_of_payloads: any[] = [];
			for (let i = 0; i < res.data.vc_list.length; i++) {
				// decode jwt and add it to the credential state
        console.log('raw vc = ', res.data.vc_list[i].vcJWT)
				const { vc } = decode<{vc: any}>(res.data.vc_list[i].vcJWT);

				// const payload = jwtDecode(res.data.vc_list[i].vcJWT.split('.')[1]);
				console.log('load = ', vc);
				array_of_payloads.push(vc);
			}
			console.log('vc list = ', array_of_payloads)
			setCredentials(array_of_payloads);
      if(array_of_payloads.length === 0){
        setDisabledButton(false);
      }
      setCredentialsAreLoaded(true);
		});
    
	}, []);

  async function authorizeWalletPage() {
    setLoading(true);

    await axios.post(CREATE_PRESENTATION_ENDPOINT, 
      { selected_id_set: selectedSet,
        verifier_url: verifierUrl,
        aud: audience,
        ebsi_token: localStorage.getItem('ebsi_token'),
        exp: expirationDate.toISOString()
      },
      { headers: { authorization: `Bearer ${localStorage.getItem('appToken')}` } }
    )
    .then((res) => {
      setLoading(false);
      console.log('VER RES ', res.data)
      window.location.href = res.data.verification_request_url;
    });
  }


  return (
    <div className = "gunet-container">
      <h1>{polyglot.t('Present.title')} {IssuerName}</h1>
      <div style={{ marginTop: '40px'}}>
          <CredentialList polyglot={polyglot}
            credentials={credentials}
            loaded={credentialsAreLoaded}
          />
      </div>


      <div>
      {polyglot.t('Present.exp')}:
        <DatePicker dateFormat="dd/MM/yyyy" selected={expirationDate} onChange={(date: Date) => setExpirationDate(date)} />
      </div>
      <div style={{ marginTop: '40px'}}>
          <button
              className="small login-button ui fancy button"
              onClick= {() => navigate('/') }>
              {polyglot.t('Present.buttonBack')}
          </button>
          &nbsp; &nbsp; &nbsp;
          <button
              disabled={disabledButton}
              className={!disabledButton ? "small login-button ui fancy button" : "small disabled login-button ui fancy button"}
              onClick={() => authorizeWalletPage()}>
              {polyglot.t('Present.buttonAuthorize')}
              {loading ? <Spinner className="spinner" cx={20} cy={12} r={9} /> : <></>}
          </button>
      </div>
    
    

    </div>
  );
}


export default Present;
