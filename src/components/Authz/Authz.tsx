import React, { useCallback, useEffect, useState } from 'react';
import { FuncProps } from '../../interfaces/FuncProps';
import axios from 'axios';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import CredentialList from '../CredentialList/CredentialList';
import decode from 'jwt-decode';
import { Button } from 'react-bootstrap';
import CustomButton from '../Button/CustomButton';
import Spinner from '../Spinner/Spinner';
import { userInfo } from 'os';
import Polyglot from 'node-polyglot';
// import { useNavigate } from 'react-router-dom';

// type AuthProps = {
//     onChange(value: number): void;
//     functionCall: void;
// }
const AUTH_URL = `/op/auth`;

const Authz: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [credentials, setCredentials] = useState<any[]>([]);

    const [selectedSet, setSelectedSet] = useState<any[]>([]);

    const [selectedSetLength, setSelectedSetLength] = useState<number>(0);

    const [loading, setLoading] = useState(false);

    const [requireCred, setRequireCred] = useState(true);

    const [disabledButton, setDisabledButton] = useState(true);

    const [name, setName] = useState("None");


    const [credentialsAreLoaded, setCredentialsAreLoaded] = useState<boolean>(false);

    useEffect(() => {
        console.log(selectedSet.length);

        if((selectedSetLength !== 0)){
            setDisabledButton(false);
        }else{
            setDisabledButton(true);
        }
    },[selectedSetLength]);

	useEffect(() => {
        var require_cred_check = true;
        if(searchParams.get("request") !== null){
            const jwtRequest:string = searchParams.get("request")!.toString();
            const {require_cred} = decode<{require_cred: boolean}>(jwtRequest);
            const { name } = decode<{name: string}>(jwtRequest);
            setName(name);
            if(require_cred != undefined){
                setRequireCred(require_cred);
            }
            console.log("require_cred",require_cred)
            if(require_cred !== undefined){
                require_cred_check = require_cred;
            }else{
                require_cred_check = true;
            }

        }
        if((selectedSet.length !== 0) || !require_cred_check){
            setDisabledButton(false);
        }
		// load credentials from db
		axios.post(`/vid`,
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
            console.log("length",array_of_payloads.length);
            if(array_of_payloads.length === 0){
                setDisabledButton(false);
            }
            if (array_of_payloads.length == 0) {
				setMessage("You don't have any Verifiable Credentials yet")
			}
            setCredentialsAreLoaded(true);
		});

	}, []);
    
    async function authorizeWalletPage() {
        setLoading(true);
        console.log(window.location.href.substring(window.location.href.indexOf("/auth?")+5));
        console.log(window.localStorage.getItem('did'));
        await axios.post(AUTH_URL,{
            "did": window.localStorage.getItem('did'),
            "redirectUrl": window.location.href.substring(window.location.href.indexOf("/auth?")+5),
            "selected_id_set": selectedSet
        }, {headers: { authorization: `Bearer ${localStorage.getItem('appToken')}`}})
        .then(res => {
            setLoading(false);
            console.log(res);
            console.log(res.data.redirect);
            window.location.replace(res.data.redirect);
        });
    }

    const [message, setMessage] = useState<string>("");

    return(
        <div className = "gunet-container">
             {requireCred ? <>
            <h1>{polyglot.t('Authz.title')}</h1>
            <h4>{polyglot.t('Authz.description1')} {name} {polyglot.t('Authz.description2')}
            </h4> </>
            : <> <h1>{polyglot.t('Authz.titleNoCred')}</h1>
            <h4>{polyglot.t('Authz.descriptionNoCred1')} {name} {polyglot.t('Authz.descriptionNoCred2')}
            </h4></>}
           
            
            {requireCred ?
            <div style={{ marginTop: '40px'}}>
                <CredentialList polyglot={polyglot} loaded={credentialsAreLoaded} credentials={credentials} />
            </div>
            : <></>}
            <div style={{ marginTop: '40px'}}>
                <button
                    className="small login-button ui fancy button"
                    onClick= {() => navigate('/') }>
                    {polyglot.t('Authz.buttonBack')}
                </button>
                &nbsp; &nbsp; &nbsp;
                <button
                    disabled={disabledButton}
                    className={!disabledButton ? "small login-button ui fancy button" : "small disabled login-button ui fancy button"}
                    onClick={() => authorizeWalletPage()}>
                    {polyglot.t('Authz.buttonAuthorize')}
                    {loading ? <Spinner className="spinner" cx={20} cy={12} r={9} /> : <></>}
                </button>
            </div>

      </div>
    );
}

export default Authz;