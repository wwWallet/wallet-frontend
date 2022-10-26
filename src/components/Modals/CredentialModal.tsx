import { useEffect, useState } from "react";
import Modal from 'react-modal';
import jwtDecode from 'jwt-decode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons'
import Polyglot from 'node-polyglot';
import VC from "../Credential/VC";
import { CredentialEntity } from "../../interfaces/credential.interface";
import './MyModal.css';

const CredentialModal: React.FC<{credential: CredentialEntity, polyglot: Polyglot, isOpen: boolean, closeModal(): void}> = ({credential, polyglot, isOpen, closeModal}) => {

	const handleCloseModal = () => {
		closeModal();
		setPath("");
	}

	const [credentialPayload, setCredentialPayload] = useState<any>((jwtDecode(credential.jwt) as any).vc);
	const [object, setObject] = useState<any>(undefined);
	const [path, setPath] = useState("");

	useEffect(() => {
		setObject(calculateObject(credentialPayload, path))
	}, [path])

	const calculateObject = (object: any, path: string) => {
		if (path === '')
			return object;

		return path.split('.').reduce(function (o, k) {
			return o && o[k];
		}, object);
	}

	const backtrackPath = (path: string, delim: string = '.') => {
		const paths: string[] = path.split(delim);
		paths.pop();
		return paths.join(delim);
	}

	const handleBack = () => {
		setPath((path: string) => backtrackPath(path));
	}


	const handleSetPath = (key: string) => {
		setPath((path: string) => (path === '') ? key : `${path}.${key}`);
	}

	console.log(path);

	return (
		<Modal
			className="my-modal"
			overlayClassName="my-modal-wrapper"
			isOpen={isOpen}
			ariaHideApp={false}
			onRequestClose={handleCloseModal}
		>
			<div className={`modal-header flex ${path === '' ? 'center' : ''}`}>
				<div className="modal-header-content">
					<div>
						<button type="button" id="back" onClick={handleBack}
							style={path == '' ? { 'visibility': 'hidden' } : {}}
						>
							<FontAwesomeIcon className="CloseModal" icon={faArrowLeft} />
						</button>
						{path.split('.').length > 1
							?
							<h4>{path.split('.')[path.split('.').length - 2]}</h4>
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
	);
}

export default CredentialModal;