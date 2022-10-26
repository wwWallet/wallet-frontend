import React, { useEffect, useState } from 'react'
import './CredentialList.css';
import './DetailDiploma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowLeft, faArrowUp, faBars } from '@fortawesome/free-solid-svg-icons'
import { faAward, faUniversity, faUserGraduate, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Placeholder } from 'react-bootstrap';
import Polyglot from 'node-polyglot';
import jwtDecode from 'jwt-decode';
import { CredentialEntity, Credentials } from '../../interfaces/credential.interface';
import CredentialModal from '../Modals/CredentialModal';








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

	return (
		<div className="PlainCredential">
			<div className="SingleCredential" onClick={handleOpenModal}>
				<section className="CredentialPreviewFieldsContainer">
					<div className="CredentialPreviewItem"><div className="CredentialType">{credential.type}</div></div>
					<div className="CredentialPreviewItem"><div className="CredentialIssuer">{credential.issuerInstitution}</div></div>
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