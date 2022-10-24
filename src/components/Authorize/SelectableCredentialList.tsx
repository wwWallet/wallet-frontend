import React, { useEffect, useState } from 'react'
import './SelectableCredentialList.css';
import '../CredentialList/DetailDiploma.css'
import Polyglot from 'node-polyglot';
import '../CredentialList/MyModal.css';
import { ShortVCPlaceholder } from '../CredentialList/CredentialList';
import CredentialModal from '../CredentialModal/CredentialModal';
import { CredentialEntity, SelectableCredentials } from '../../interfaces/credential.interface';
import Checkbox from '../Checkbox/Checkbox';


const SelectableCredential: React.FC<{credential: CredentialEntity, polyglot: Polyglot, handleSelectVc(identifier: string): void, handleDeselectVc(identifier: string): void}> = ({credential, polyglot, handleSelectVc, handleDeselectVc}) => {

	const [selected, setSelected] = useState<boolean>(false);
	const handleCheck = (identifier: string) => {

		setSelected((selected) => {

			selected
			?
				handleDeselectVc(identifier)
			:
				handleSelectVc(identifier);
			
			return !selected;
		});

	}

	const [isOpen, setIsOpen] = useState<boolean>(false);
	const handleOpenModal = () => {
		setIsOpen(true);
	}
	const handleCloseModal = () => {
		setIsOpen(false);
	}

	return (
		<div className='SelectableCredential'>
			<div className={`SplitCredential ${selected ? 'selected' : ''}`}>
				<div className='selection' onClick={() => handleCheck(credential.identifier)}>
					<Checkbox id={credential.identifier} checked={selected} onChange={() => handleCheck(credential.identifier)} />
				</div>
				<div className="SingleCredential" onClick={handleOpenModal}>
					<section className="CredentialPreviewFieldsContainer">
						<div className="CredentialPreviewItem"><div className="CredentialType">{credential.type}</div></div>
						<div className="CredentialPreviewItem"><div className="CredentialIssuer">{credential.issuerInstitution}</div></div>
					</section>
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