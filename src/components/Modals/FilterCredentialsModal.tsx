import Modal from 'react-modal';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomSelect from "../CustomSelect/CustomSelect";
import { SelectElement } from '../../interfaces/SelectProps';
import './MyModal.css';

const FilterCredentialsModal: React.FC<{isOpen: boolean, handleClose(): void, credentialTypes: SelectElement[]}> = ({isOpen, handleClose, credentialTypes}) => {

	return (
		<Modal
			className="my-modal"
			overlayClassName="my-modal-wrapper"
			isOpen={isOpen}
			ariaHideApp={false}
			onRequestClose={handleClose}
		>
			<div className="modal-header">
				<h4>Filter Credentials</h4>
				<button type="button" id="close" onClick={handleClose}>
					<FontAwesomeIcon className="CloseModal" icon={faTimes} />
				</button>
			</div>
			<div className='content'>
				<div className="filter-vc-container">
					Credential Type:
					<CustomSelect items={credentialTypes} onChange={() => { }} />
					<button
						className="small login-button ui fancy button authorize-btn"
						onClick={() => { handleClose() }}>
						Apply
					</button>
				</div>
			</div>
		</Modal>
	);
}

export default FilterCredentialsModal;