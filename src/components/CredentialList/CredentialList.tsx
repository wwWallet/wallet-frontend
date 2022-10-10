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
interface IProps {
    credentials: IState["credentials"]
}


interface SelectedParams {
	isSelected: boolean;
	setIsSelected: (x: boolean) => any;
}

export interface Credential {
	polyglot: Polyglot;
    credential: any;
	type?: any;
	present?: PresentArguments;
	handleSetSelectedVc: (vc: any) => void;
}


export interface PresentArguments {
	selectedSet: any[];
	setSelectedSet: (x: any[]) => void;
	selectedSetLength: number;
	setSelectedSetLength: (x: number) => void;
}
export interface Credentials {
	polyglot: Polyglot;
    credentials: Credential[];
	present?: PresentArguments;
	loaded?: boolean;
}


const FieldPack = (props: any) => {
	return (
	  <table>
		<tbody>
		  {Object.keys(props.values).map(key => (
			<tr>
			  <td>{key}</td><td>{props.values[key]}</td>
			</tr>
		  ))}
		</tbody>
	  </table>
	)
}

const ShortVID = (props: any) => {
	const isSelected = () => {
		return (props.selected === true);
	}
	return (
		<div className={!isSelected() ? 'diplomabox' : 'diplomabox-selected'} onClick={props.toggleSelect}>
			<div className='headerbox'>
				<div className='fields'>
				<span className='field bold'>{props.polyglot.t('ShortVc.verifiableId')}</span>
				<span className='field'>{props.credential.credentialSubject.id}</span>

				</div>
				<div className='action' 
					// onClick={ () => navigate("/detailed/vid/"+props.credential.id, {replace: true, state: { path: window.location.href.substring(window.location.href.indexOf(location.pathname)) }}) } >
					onClick={ props.handleSetSelectedVc } >
				{/* <FontAwesomeIcon className='icon' icon={'bars'}/> */}
				<span className="fa fa-bars" />
				</div>
			</div>
		</div>
	)
}

const ShortVC = (props: any) => {
	const isSelected = () => {
		return (props.selected === true);
	}
	return (
		<div className={!isSelected() ? 'diplomabox' : 'diplomabox-selected'} onClick={props.toggleSelect}>
			<div className='headerbox'>
				<div className='fields'>
				<span className='field bold'>{props.polyglot.t('ShortVc.verifiableCredential')}</span>
				<span className='field bold'>{props.polyglot.t('ShortVc.diploma')}</span>
				<span className='field'>{props.credential.credentialSubject.id}</span>
				</div>
				<div className='action' 
					// onClick={ () => navigate("/detailed/vc/"+props.credential.id, {replace: true, state: { path: window.location.href.substring(window.location.href.indexOf(location.pathname)) }}) } >
					onClick={ props.handleSetSelectedVc } >
				{/* <FontAwesomeIcon className='icon' icon={'bars'}/> */}
				<span className="fa fa-bars" />
				</div>
			</div>
		</div>
	)
}
export const RenderVC: React.FC<Credential> = ({ polyglot, credential, present, handleSetSelectedVc }) => {

	const [isSelected, setIsSelected] = useState<boolean>(false);
	const toogle = () => {
		if (present !== undefined) {
			if (present.selectedSet.includes(credential.id)) { // is selected
				const idx = present.selectedSet.indexOf(credential.id);
				present.selectedSet.splice(idx, 1);
				setIsSelected(false);
				present.setSelectedSetLength(present.selectedSetLength - 1)
			}
			else { // if not selected then toggle on
				const already = present.selectedSet;
				already.push(credential.id);
				present.setSelectedSet(already);
				present.setSelectedSetLength(present.selectedSetLength + 1)
				setIsSelected(true);
			}
			console.log('updated selected set = ', present.selectedSet);
		}

	}

	const setSelectedVc = () => {
		handleSetSelectedVc(credential);
	}

	if (credential.type.includes("VerifiableId")) {
		return (
			<div>
				<ShortVID polyglot={polyglot} selected={isSelected} toggleSelect={toogle} credential={credential} handleSetSelectedVc={setSelectedVc}/>
			</div>
		);
  }
	else
		return (
			<div>
				<ShortVC polyglot={polyglot} selected={isSelected} toggleSelect={toogle} credential={credential} handleSetSelectedVc={setSelectedVc}/>
			</div>
		);
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

const CredentialList: React.FC<Credentials> = ({ polyglot, credentials, present, loaded }) => {

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
		return credentials.map((credential: any, index: any) => {
			return (
				<div key={index} id={index} style={{marginTop: '20px'}}>
					<RenderVC polyglot={polyglot} credential={credential} present={present} handleSetSelectedVc={handleSetSelectedVc}/>
				</div>
			);
		});
	}

	return (
		<ul className='credentials-container'>
			{ loaded ? 
			<>
				{renderList()} 
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
		</ul>
	)
}



export default CredentialList;
