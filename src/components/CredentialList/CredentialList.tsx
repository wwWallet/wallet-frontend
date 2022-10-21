import React, { useEffect, useState } from 'react'
import './CredentialList.css';
import './DetailDiploma.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowLeft, faArrowUp, faBars } from '@fortawesome/free-solid-svg-icons'
import { faAward, faUniversity, faUserGraduate, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Placeholder } from 'react-bootstrap';
import Polyglot from 'node-polyglot';
import Modal from 'react-modal';
import './MyModal.css';
import VC from '../Credential/VC';
import jwtDecode from 'jwt-decode';



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
		setPath("");
	}

	const [credentialPayload, setCredentialPayload] = useState<any>((jwtDecode(credential.jwt) as any).vc);
	const [object, setObject] = useState<any>(undefined);
	const [path, setPath] = useState("");
	
	useEffect(() => {

		// console.log('useeffect path: ', path);
		// console.log('calc obj: ', calculateObject(credential, path));

		setObject(calculateObject(credentialPayload, path))
	}, [path])

	// useEffect(() => {
	// 	setObject((jwtDecode(credential.jwt) as any).vc);
	// }, []);


	const calculateObject = (object: any, path: string) => {

		if(path === '')
			return object;

		return path.split('.').reduce(function(o, k) {
			return o && o[k];
		}, object);
	}

	const backtrackPath = (path: string, delim: string = '.') => {

		const paths: string[] = path.split(delim);
		paths.pop();
		return paths.join(delim);

	}

	const handleBack = () => {
		setPath( (path: string) => backtrackPath(path) );
	}


	const handleSetPath = (key: string) => {
		setPath( (path: string) => (path === '') ? key : `${path}.${key}`);
	}

	return (
		<div>
			<div className="SingleCredential" onClick={handleOpenModal}>
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
					onRequestClose={handleCloseModal}
				>
					<div className={`header ${path =='' ? 'center': ''}`}>
						<div className="main-header">
							<div>
								<button type="button" id="back" onClick={handleBack}
									style={ path == '' ? {'visibility': 'hidden'} : {}}
								>
									<FontAwesomeIcon className="CloseModal" icon={faArrowLeft} />
								</button>
								{path.split('.').length > 1
								?
									<h4>{path.split('.')[path.split('.').length-2]}</h4>
								:
									<h4>{polyglot.t('ShortVc.verifiableCredential')}</h4>
								}
							</div>
							<button type="button" id="close" onClick={handleCloseModal}>
								<FontAwesomeIcon className="CloseModal" icon={faTimes} />
							</button>
						</div>
						{path !== '' &&
							<div className="obj-breadcrumb">
								{path}
							</div>
						}
					</div>
					<div className='content'>
						<VC handleSetPath={handleSetPath} credential={object} /*name={path.split('.').slice().join('.')}*/ />
					</div>
				</Modal>
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