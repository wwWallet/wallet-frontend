import React, { useEffect, useState } from 'react'
import './CredentialList.css';
import './DetailDiploma.css'
import { Placeholder } from 'react-bootstrap';
import Polyglot from 'node-polyglot';
import { CredentialEntity, Credentials } from '../../interfaces/credential.interface';
import CredentialModal from '../Modals/CredentialModal';
import { decodeVC } from '../../utils/credentialUtils';
import axios from 'axios';
import { base64url } from 'jose';
import config from '../../config/config.dev';








export const ShortVCPlaceholder = () => {
	return (
		<div className={'diplomabox placeholders'} >
			<div className='headerbox'>
				<div className='fields'>
				<Placeholder as="p" animation="glow">
					<Placeholder xs={10} />
					<Placeholder xs={5} />
					<Placeholder xs={8} />
				</Placeholder>
				</div>
				<div className='action'>
					<span className="fa fa-bars" />
				</div>				
			</div>
		</div>
	)
}


const Credential: React.FC<{credential: CredentialEntity, polyglot: Polyglot}> = ({credential, polyglot}) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const handleOpenModal = () => {
		setIsOpen(true);
	}
	const handleCloseModal = () => {
		setIsOpen(false);
	}

	const [issuerName, setIssuerName] = useState<string>("");
	const [readableIssuanceDate, setReadableIssuanceDate] = useState<string>("");

	useEffect(() => {
		// get issuer from jwtpayload
		const payload = JSON.parse(new TextDecoder().decode(base64url.decode(credential.credential.split('.')[1])));
		const issuerDID = payload.vc.issuer;
		// fetch issuer name from tir
		axios.get(config.ebsi.tirRegistryUrl + '/' + issuerDID).then(res => {
			const body = res.data.attributes[0].body;
			const name = JSON.parse(new TextDecoder().decode(base64url.decode(body))).institution;
			setIssuerName(name);
		});
		const date = new Date(decodeVC(credential).vc.issuanceDate);
		const format = date.toDateString()
		setReadableIssuanceDate(format);
	}, []);
	return (
		<div className="PlainCredential">
			<div className="SingleCredential" onClick={handleOpenModal}>
				<section className="CredentialPreviewFieldsContainer">
					<div className="CredentialPreviewItem">
						
							<section className="BoxHeader">
								<div className="BoxHeaderItem"> <div className="CredentialIssuer">{issuerName}</div></div>
								<div className="BoxHeaderItem"> {" • " + readableIssuanceDate}</div>
							</section>
						</div>
					<div className="CredentialPreviewItem"><div className="CredentialType">{decodeVC(credential).vc.type[0]}</div></div>
				</section>
			</div>
			<CredentialModal credential={credential} polyglot={polyglot} isOpen={isOpen} closeModal={handleCloseModal}/>
		</div>
	);
		
}

const CredentialList: React.FC<Credentials> = ({ polyglot, credentials, loaded }) => {	

	const renderList = (): JSX.Element[] => {
		return credentials.map((credential: CredentialEntity, index: any) => {
			return (
				<div key={index} id={index} style={{marginTop: '20px'}} >
					<Credential polyglot={polyglot} credential={credential} />
				</div>
			);
		});
	}

	return (
		<div className='credentials-container'>
			{ loaded ? 
			<div className="Credentials">
				{renderList()} 
			</div>
			:
			<div>
				<ShortVCPlaceholder />
				<ShortVCPlaceholder />
			</div>
			}
		</div>
	)
}



export default CredentialList;