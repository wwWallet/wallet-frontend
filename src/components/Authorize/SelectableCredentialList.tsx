import React, { useEffect, useState } from 'react'
import './SelectableCredentialList.css';
import '../CredentialList/DetailDiploma.css'
import Polyglot from 'node-polyglot';
import { ShortVCPlaceholder } from '../CredentialList/CredentialList';
import CredentialModal from '../Modals/CredentialModal';
import { CredentialEntity, SelectableCredentials } from '../../interfaces/credential.interface';
import Checkbox from '../Checkbox/Checkbox';
import { decodeVC } from '../../utils/credentialUtils';
import axios from 'axios';
import config from '../../config/config.dev';
import { base64url } from 'jose';
import '../CredentialList/CredentialList.css';

const SelectableCredential: React.FC<{credential: CredentialEntity, polyglot: Polyglot, handleSelectVc(identifier: string): void, handleDeselectVc(identifier: string): void}> = ({credential, polyglot, handleSelectVc, handleDeselectVc}) => {

	const [selected, setSelected] = useState<boolean>(false);
	const handleCheck = () => {
		setSelected((selected) => selected = !selected);
	}

	useEffect(() => {
    
		selected
			?
				handleSelectVc(credential.id.toString())
			:
				handleDeselectVc(credential.id.toString());

  }, [selected]);

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
		<div id="SelectableCredential" >
			<div className="SelectableCredential">
				<div className={`SplitCredential ${selected ? 'selected' : ''}`}>
					<div className='selection' onClick={handleCheck}>
						<Checkbox id={credential.id.toString()} checked={selected} onChange={handleCheck} />
					</div>
					<div className="SingleCredential" onClick={handleOpenModal}>
						<section className="CredentialPreviewFieldsContainer">
							<section className="BoxHeader">
								<div className="BoxHeaderItem"> <div className="CredentialIssuer">{issuerName}</div></div>
								<div className="BoxHeaderItem"> {" • " + readableIssuanceDate}</div>
							</section>
							<div className="CredentialPreviewItem"><div className="CredentialType">{decodeVC(credential).vc.type[0]}</div></div>
						</section>
					</div>
				</div>
			</div>

			<CredentialModal credential={credential} polyglot={polyglot} isOpen={isOpen} closeModal={handleCloseModal}/>
		</div>
	);
		
}

const SelectableCredentialList: React.FC<SelectableCredentials> = ({ polyglot, credentials, loaded, handleSelectVc, handleDeselectVc }) => {	

	const renderList = (): JSX.Element[] => {
		return credentials.map((credential: CredentialEntity, index: any) => {
			return (
				<div key={index} id={index} style={{marginTop: '20px'}} >
					<SelectableCredential polyglot={polyglot} credential={credential} handleSelectVc={handleSelectVc} handleDeselectVc={handleDeselectVc}/>
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



export default SelectableCredentialList;