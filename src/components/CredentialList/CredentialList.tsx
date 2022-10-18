import React, { useState } from 'react'
import Card from 'react-bootstrap/Card';
import { useLocation, useNavigate } from 'react-router-dom';
import { IState } from '../interfaces';
import './CredentialList.css';
import './DetailDiploma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faBars } from '@fortawesome/free-solid-svg-icons'
import { faAward, faUniversity, faUserGraduate, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Placeholder } from 'react-bootstrap';
import Polyglot from 'node-polyglot';
import Modal from 'react-modal';
import './MyModal.css';
import ModalVID from '../DetailedVC/ModalVID';
import ModalDiploma from '../DetailedVC/ModalDiploma';
import ModalCredential from '../DetailedVC/ModalCredential';
import VC from '../Credential/VC';



export interface Credentials {
	polyglot: Polyglot;
  credentials: CredentialEntity[];
	loaded?: boolean;
}


export interface CredentialEntity {
	id: number;
	identifier: string;
	jwt: string;
	holderDID: string;
	issuerDID: string;
	issuerInstitution: string;
	type: string;
}




export const ShortVCPlaceholder = (props: any) => {


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


const Credential: React.FC<{credential: CredentialEntity}> = ({credential}) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [selectedVc, setSelectedVc] = useState<any>({});
	const handleSetSelectedVc = (vc: any) => {
		setSelectedVc(vc);
		console.log('selected vc: ', vc);
		setIsOpen(true);
	}
	const handleSetIsOpen = (open: boolean) => {
		setIsOpen(open);
	}
	const handleOpenModal = () => {
		setIsOpen(true);
	}
	const handleCloseModal = () => {
		setIsOpen(false);
	}
	
	return <>
		<div>
			<div className="SingleCredential" onClick={() => setIsOpen(true)}>
				<section className="CredentialPreviewFieldsContainer">
					<div className="CredentialPreviewItem"><div className="CredentialType">{credential.type}</div></div>
					<div className="CredentialPreviewItem"><div className="CredentialIssuer">{credential.issuerInstitution}</div></div>
				</section>
			</div>
				<Modal
					className="my-modal"
					overlayClassName="my-modal-wrapper"
					isOpen={isOpen}
					ariaHideApp={false}
					onRequestClose={() => setIsOpen(false)}
				>
					<div className="header">
						<button type="button" onClick={handleCloseModal}>
							<FontAwesomeIcon className="CloseModal" icon={faTimes} />
						</button>
					</div>
					<div className='content'>
						<VC credential={credential} />
					</div>
				</Modal>
		</div>

		
	</>
}

const CredentialList: React.FC<Credentials> = ({ polyglot, credentials, loaded }) => {

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [selectedVc, setSelectedVc] = useState<any>({});
	const handleSetSelectedVc = (vc: any) => {
		setSelectedVc(vc);
		console.log('selected vc: ', vc);
		setIsOpen(true);
	}
	const handleSetIsOpen = (open: boolean) => {
		setIsOpen(open);
	}
	const handleOpenModal = () => {
		setIsOpen(true);
	}
	const handleCloseModal = () => {
		setIsOpen(false);
	}
	

	const renderList = (): JSX.Element[] => {
		return credentials.map((credential: CredentialEntity, index: any) => {
			return (
				<div key={index} id={index} style={{marginTop: '20px'}} >
					<Credential credential={credential} />
				</div>
			);
		});
	}

	return (
		<div className='credentials-container'>
			{ loaded ? 
			<>
				<div className="Credentials">
					{renderList()} 
				</div>
				<Modal
					className="my-modal"
					overlayClassName="my-modal-wrapper"
					isOpen={isOpen}
					ariaHideApp={false}
				>
					<div className="header">
						{selectedVc && Object.keys(selectedVc).length !== 0 && selectedVc.type.includes('VerifiableId') &&
							<h4>{polyglot.t('ShortVc.verifiableId')}</h4>
						}
						{selectedVc && Object.keys(selectedVc).length !== 0 && selectedVc.type.includes('Europass') &&
							<h4>{polyglot.t('ShortVc.diploma')}</h4>
						}
						{selectedVc && Object.keys(selectedVc).length !== 0 && !selectedVc.type.includes('Europass') && !selectedVc.type.includes('VerifiableId') &&
							<h4>{polyglot.t('ShortVc.verifiableCredential')}</h4>
						}
						<button type="button" onClick={handleCloseModal}>
							<FontAwesomeIcon icon={'times'} />
						</button>
					</div>
					<div className="content">
						<div id="diploma">

						{selectedVc && Object.keys(selectedVc).length !== 0 && selectedVc.type.includes('VerifiableId') &&
							<ModalVID
								selectedVC={selectedVc}
								polyglot={polyglot}
							/>
						}
						{selectedVc && Object.keys(selectedVc).length !== 0 && selectedVc.type.includes('Europass') &&
							<ModalDiploma
								selectedVC={selectedVc}
								polyglot={polyglot}
							/>
						}
						{selectedVc && Object.keys(selectedVc).length !== 0 && !selectedVc.type.includes('Europass') && !selectedVc.type.includes('VerifiableId') &&
							<ModalCredential
								selectedVC={selectedVc}
								polyglot={polyglot}
							/>
						}
						</div>
					</div>
				</Modal>
			</>
			:
			<>
				<ShortVCPlaceholder />
				<div style={{'marginTop': '30px'}}>
					<ShortVCPlaceholder />
				</div>
			</>
			}
		</div>
	)
}



export default CredentialList;
