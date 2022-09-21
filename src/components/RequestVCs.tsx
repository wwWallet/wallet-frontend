import React, { useEffect, useState } from 'react'
import axios from 'axios';
import '../App.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from './Button/CustomButton';
import CustomButton from './Button/CustomButton';
import { Spinner } from './Spinner';
import Polyglot from 'node-polyglot';

interface Ticket {
    state: string,
    at: string
}

const RequestVCs: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const [Sent, setSent] = useState(true);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const state: string = searchParams.get("state") as string;
    const vcEndpoint: string = searchParams.get("issuer_url") as string;

    const [credentialsAreReceived, setCredentialsAreReceived] = useState<boolean>(false);

    useEffect(() => {
        requestVCs();
    }, []);

    async function requestVCs() {
        // Send {state, vc_endpoint} to the backend
        // backend will request the VCs and store them into the DB
        // client will be redirected to main page of wallet
        await axios.post(`/op/request-vc`, {state: state, ebsi_token:localStorage.getItem('ebsi_token'), vc_endpoint: vcEndpoint}, { headers: {
            Authorization: `Bearer ${localStorage.getItem('apptoken')}`
        }}).then(success => {
            setCredentialsAreReceived(true)
        })
        .catch(err => {
            setCredentialsAreReceived(true)

            console.log('Failed to communicated with wallet backend. Detailed err: ', err)
        });
    
    };

    return (
        <React.Fragment>
            {Sent? 
            <div className = "gunet-container">
                <h1>{polyglot.t('RequestVc.title')}</h1>
                <span>{polyglot.t('RequestVc.description')}</span> <br/>
                <CustomButton buttonDisabled={credentialsAreReceived ? false : true}
                        onClick={() => navigate('/') }
                        text={ polyglot.t( "RequestVc."+ (credentialsAreReceived ? "done" : "loading"))}>
                    {!credentialsAreReceived ? <Spinner className="spinner" cx={20} cy={12} r={9} /> : <></>}
                </CustomButton>

            </div>
            
            :
            <div className = "gunet-container">
                <h1>{polyglot.t('RequestVc.error')}</h1>
            </div>
            }
        </React.Fragment>

    );
}

export default RequestVCs;