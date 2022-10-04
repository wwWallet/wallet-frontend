import React, { useEffect, useState } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import {useNavigate} from 'react-router-dom';
import CredentialList from './CredentialList/CredentialList';
import axios from 'axios';
import decode from 'jwt-decode';
import './Wallet.css';
import { Card, Form, Placeholder } from 'react-bootstrap';
import SeparatedCredentials from './SeparatedCredentials/SeparatedCredentials';
import uniLogo from '../static/icons/uni-logo.png';
import verifierLogo from '../static/icons/verifier.png';
import ministryLogo from '../static/icons/minlogo.png';
import Export from './Export';
import VpAudit from './VpAudit/VpAudit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faBars } from '@fortawesome/free-solid-svg-icons';
import Polyglot from 'node-polyglot';
import Modal from 'react-modal';
import config from '../config/config.dev';
import IssuerList from './IssuerList/IssuerList';

const ShortVCPlaceholder = (props: any) => {


	return (
		<div className={'diplomabox'} >
			<div className='headerbox'>
				<div className='fields'>
				<Placeholder as="p" animation="glow">
					<Placeholder xs={10} />

					<Placeholder xs={5} />
					<Placeholder xs={8} />

				</Placeholder>
				</div>
				<div className='action'>
					{/* <FontAwesomeIcon className='icon' icon={'bars'}/> */}
					<span className="fa fa-bars" />
				</div>				
				
			</div>
		</div>
	)
}

const Wallet: React.FC<{polyglot: Polyglot, handleLanguage(lang: string): void}> = ({polyglot, handleLanguage}) => {

	const navigate = useNavigate();	
	const [credentials, setCredentials] = useState<any[]>([]);
	const [message, setMessage] = useState<string>("");

	const [credentialsAreLoaded, setCredentialsAreLoaded] = useState<boolean>(false);

  	const handleSelect = (key: string | null) => {
	    if (key && key === "logout")
    	    logout();
	}

	useEffect(() => {
		// load credentials from db
		axios.get(config.storeBackend.vc_storage_url+'/vc',
		{ headers : {
			Authorization: `Bearer ${localStorage.getItem('appToken')}`
		}})
		.then(res => {
			const array_of_payloads: any[] = [];
			for (let i = 0; i < res.data.vc_list.length; i++) {
				// decode jwt and add it to the credential state
				console.log('vcjwt = ', res.data.vc_list[i].vcJWT)
				const { vc } = decode<{vc: any}>(res.data.vc_list[i].vcJWT);

				// const payload = jwtDecode(res.data.vc_list[i].vcJWT.split('.')[1]);
				console.log('load = ', vc);
				array_of_payloads.push(vc);
			}
			console.log('vc list = ', array_of_payloads)
			setCredentials(array_of_payloads);
			if (array_of_payloads.length == 0) {
				setMessage(polyglot.t('Wallet.tab1.emptyVC'));
			}
			setCredentialsAreLoaded(true);

		});
	}, []);

	const logout = () => {
		localStorage.setItem('appToken', '');
		navigate('/login');
	}

	return (
		<Tabs defaultActiveKey="credentials" id="wallet-tabs" className="mb-3" onSelect={(k) => handleSelect(k)}>
			<Tab eventKey="credentials" title={polyglot.t('Wallet.tab1.title')}>
				<div className="gunet-container">
					<div>
						{message ? 
							<>
								<div className="message">{message}</div>
								<span>{polyglot.t('Wallet.tab1.vidPrompt')}</span>
								<br/>
								<button
									className="login-button ui fancy button"
									onClick={() => {window.location.href = '/'}}>
									{polyglot.t('Wallet.tab1.vidButton')} {' '}
								</button>
							</>
							: <SeparatedCredentials polyglot={polyglot} credentials={credentials} loaded={credentialsAreLoaded}/>
						}

					</div>
				</div>
			</Tab>
			<Tab eventKey="profile" title={polyglot.t('Wallet.tab2.title')}>
				<div className="gunet-container">
		 			{/* <div className='message'>
		 				This is where you can find the Verifiable Credentials you have presented to third-party organizations.
		 			</div> */}
					{/* <VpAudit polyglot={polyglot}/> */}
				</div>
			</Tab>
			<Tab eventKey="settings" title={polyglot.t('Wallet.tab3.title')}>
				<div className="gunet-container">
					<Form>
						<Form.Check
							type="switch"
							id="custom-switch"
							label={polyglot.t('Wallet.tab3.dataHub')}
						/>
					</Form>
					<Export polyglot={polyglot}/>
				</div>
			</Tab>
			<Tab eventKey="services" title={polyglot.t('Wallet.tab4.title')}>
				<div className="gunet-container stable">
					<Card className='mb-2 anims redirectCard mrgn2 enhanced'
						onClick={
							() => {window.location.href = '/'}
						}
					>
						<Card.Body>
							<img className="service-thumbnail" id="ministry-logo" src={ministryLogo}></img>
							<Card.Text><strong>{polyglot.t('Wallet.tab4.vid')}</strong></Card.Text>
						</Card.Body>
					</Card>
					<Card className='mb-2 anims redirectCard mrgn2 enhanced'
						onClick={
							() => {window.location.href = '/'}
						}
					>
						<Card.Body>
							<Card.Text>
								<img className="service-thumbnail" id="uni-logo" src={uniLogo}></img>
								<strong>{polyglot.t('Wallet.tab4.diplomaHeader')}</strong>
								<br />
								<span className="card-subtitle">{polyglot.t('Wallet.tab4.diplomaDesc')}</span>
							</Card.Text>
						</Card.Body>
					</Card>
					<Card className='mb-2 anims redirectCard mrgn2 enhanced'
						onClick={
							() => {window.location.href = '/'}
						}
					>
						<Card.Body>
							<Card.Text>
								<img className="service-thumbnail" id="verifier-logo" src={verifierLogo}></img>
								<strong>{polyglot.t('Wallet.tab4.verifyHeader')}</strong>
								<br />
								<span className="card-subtitle">{polyglot.t('Wallet.tab4.verifyDesc')}</span>
							</Card.Text>
						</Card.Body>
					</Card>
				</div>
			</Tab>
			<Tab eventKey="findIssuers" title={polyglot.t('Wallet.tab5.title')}>
				<IssuerList polyglot={polyglot}/>
			</Tab>
			<Tab eventKey="logout" title={polyglot.t('Wallet.logout')} id="logout" className="btn btn-danger" style={{ "color": "red" }} />
		</Tabs>
	);
}

export default Wallet;
