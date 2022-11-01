import { useEffect, useState } from "react";
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons'
import VC from "../Credential/VC";
import { VCPayload } from "../../interfaces/credential.interface";
import './MyModal.css';
import { decodeVC } from "../../utils/credentialUtils";
import { CredentialModalProps } from "../../interfaces/modals.interface";
import { getSchemasFromObject } from "../../utils/viewCredentialUtils";

const CredentialModal: React.FC<CredentialModalProps> = ({credential, polyglot, isOpen, closeModal}) => {

	const [credentialPayload, setCredentialPayload] = useState<VCPayload>();
	const [object, setObject] = useState<any>(undefined);
	const [path, setPath] = useState("");
	const [titles, setTitles] = useState<string[]>([]);	// Titles stack for backtracking
	const [schemas, setSchemas] = useState<any[]>([]);

	const handleCloseModal = () => {
		closeModal();
		setPath("");
		setTitles([]);
	}

	useEffect(() => {
		setCredentialPayload((decodeVC(credential)).vc)
	}, [credential])

	useEffect(() => {
		setObject(calculateObject(credentialPayload, path))
	}, [credentialPayload, path])

	
	useEffect( () => {
		const getSchemas = async () => {
			const schemasRes: any[] = await getSchemasFromObject(credentialPayload);
			setSchemas(schemasRes);
		}
		getSchemas();
	})

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
		setTitles((titles) => titles = titles.slice(0,-1));
	}

	const handleSetPath = (key: string, name?: string) => {
		setPath((path: string) => (path === '') ? key : `${path}.${key}`);
		if(name)
			setTitles((titles) => titles = [...titles, name]);
	}

	return (
		<Modal
			className="my-modal"
			overlayClassName="my-modal-wrapper"
			isOpen={isOpen}
			ariaHideApp={false}
			onRequestClose={handleCloseModal}
		>
			<div className={"modal-header flex center"}>
				<div className="modal-header-content">
					<div>
						<button type="button" id="back" onClick={handleBack}
							style={path === '' ? { 'visibility': 'hidden' } : {}}
						>
							<FontAwesomeIcon className="CloseModal" icon={faArrowLeft} />
						</button>
						{titles.length > 0
							?
							<h4>{titles[titles.length-1]}</h4>
							:
							<h4>{polyglot.t('ShortVc.verifiableCredential')}</h4>
						}
					</div>
					<button type="button" id="close" onClick={handleCloseModal}>
						<FontAwesomeIcon className="CloseModal" icon={faTimes} />
					</button>
				</div>
				{/* {path !== '' &&
					<div className="obj-breadcrumb">
						{path}
					</div>
				} */}
			</div>
			<div className='content'>
				<VC handleSetPath={handleSetPath} credential={object} path={path} schemas={schemas} />
			</div>
		</Modal>
	);
}

export default CredentialModal;