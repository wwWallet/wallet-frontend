import Modal from 'react-modal';
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CustomSelect from "../CustomSelect/CustomSelect";
import { SelectElement } from '../../interfaces/SelectProps';
import { useState } from 'react';
import './MyModal.css';
import { FilterCredentialModalProps } from '../../interfaces/modals.interface';

const FilterCredentialsModal: React.FC<FilterCredentialModalProps> = (
	{ isOpen, handleClose, handleSelect,
		credentialTypes, selectedCredentialTypes, polyglot }) => {

	const [types, setTypes] = useState<SelectElement[]>([]);

	const handleTypes = (types: SelectElement[]) => {
		setTypes(types);
	}

	return (
		<Modal
			className="my-modal"
			overlayClassName="my-modal-wrapper"
			isOpen={isOpen}
			ariaHideApp={false}
			onRequestClose={handleClose}
		>
			<div className="modal-header">
				<h4>{polyglot.t('FilterCredentials.title')}</h4>
				<button type="button" id="close" onClick={handleClose}>
					<FontAwesomeIcon className="CloseModal" icon={faTimes} />
				</button>
			</div>
			<div className='content'>
				<div className="filter-vc-container">
					{polyglot.t('FilterCredentials.type')}:
					<CustomSelect defaultVal={selectedCredentialTypes} items={credentialTypes} isMulti onChange={handleTypes} />
					<button
						className="small login-button ui fancy button authorize-btn"
						onClick={() => { handleSelect(types) }}>
						{polyglot.t('FilterCredentials.apply')}
					</button>
				</div>
			</div>
		</Modal>
	);
}

export default FilterCredentialsModal;