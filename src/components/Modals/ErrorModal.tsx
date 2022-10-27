import Modal from 'react-modal';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './MyModal.css';
import { ErrorModalProps } from '../../interfaces/modals.interface';

const ErrorModal: React.FC<ErrorModalProps> = ({isOpen, handleClose, polyglot, err}) => {

	return (
		<Modal
			className="my-modal"
			overlayClassName="my-modal-wrapper"
			isOpen={isOpen}
			ariaHideApp={false}
			onRequestClose={handleClose}
		>
			<div className="modal-header fail">
				<h4>{polyglot.t('Consent.errorTitle')}</h4>
				<button type="button" onClick={handleClose}>
					<FontAwesomeIcon className="CloseModal" icon={faTimes} />
				</button>
			</div>
			<div className='content'>
				<p>{polyglot.t('Consent.errorMsg')}</p>
				<p>{polyglot.t('Consent.errorMsg2')}</p>
				<p>{err}</p>
				<p>{polyglot.t('Consent.errorMsg3')}</p>
			</div>
		</Modal>
	);
}
export default ErrorModal;