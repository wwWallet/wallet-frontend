import config from "../../config/config.dev";
import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import CredentialList from "../CredentialList/CredentialList";
import { CredentialEntity } from "../../interfaces/credential.interface";
import './MyCredentials.css';
import FilterCredentialsModal from "../Modals/FilterCredentialsModal";
import { SelectElement } from "../../interfaces/SelectProps";
import { credentialHasSelectedTypes, extractAllCredentialTypes } from "../../utils/credentialUtils";

const MyCredentials: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	const [credentials, setCredentials] = useState<any[]>([]);
	const [selectedCredentials, setSelectedCredentials] = useState<any[]>([]);

	const [credentialTypes, setCredentialTypes] = useState<SelectElement[]>([]);
	const [selectedCredentialTypes, setSelectedCredentialTypes] = useState<SelectElement[]>([]);

	// modal
	const [modalSettings, setModalSettings] = useState<boolean>(false);
	const handleOpenModal = () => {
		setModalSettings(true);
	}
	const handleCloseModal = () => {
		setModalSettings(false);
	}
	// end modal

	// load credentials from db
	useEffect(() => {
		setLoading(false);
		axios.get<{vc_list: CredentialEntity[]}>(config.storeBackend.vcStorageUrl + '/vc',
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`
				}
			}
		).then(res => {
			const fetchedCredentials: any[] = res.data.vc_list;
			console.log("Credentials = ", res.data)
			setCredentials(fetchedCredentials);
			if (fetchedCredentials.length == 0) {
				setMessage(polyglot.t('Wallet.tab1.emptyVC'));
			}
			setLoading(true);
			
		});
	}, []);

	// Set Credential Types from user types
	useEffect(() => {
		setCredentialTypes(extractAllCredentialTypes(credentials));
	}, [credentials]);

	const handleSelectTypes = (types: SelectElement[]) => {
		setSelectedCredentialTypes(types);
		handleCloseModal();
	}

	// Filter visible (selected) credentials
	useEffect(() => {

		// If no filters added, show all credentials
		if(selectedCredentialTypes.length == 0) {
			setSelectedCredentials(credentials);
			return;
		}

		const visibleCredentials: any[] = [];

		credentials.forEach( (credential) => {
			if (credentialHasSelectedTypes(credential, selectedCredentialTypes) == true)
				visibleCredentials.push(credential);
		});

		setSelectedCredentials(visibleCredentials);

	}, [credentials, selectedCredentialTypes])

	return (
		<div className="gunet-container">
			{message ?
				<React.Fragment>
					<div className="message">{message}</div>
				</React.Fragment>
				:
				<div>
					<h4>{polyglot.t('Wallet.tab1.verifiableCredentials')}</h4>
					<div className='filter-vc'>
						<span className="hamburger fa fa-bars" onClick={handleOpenModal}/>
					</div>
					<CredentialList polyglot={polyglot} credentials={selectedCredentials} loaded={loading} />
					{!credentials.length && !loading &&
						<div className="message">
							{polyglot.t('Wallet.tab1.emptyVC')}
						</div>
					}
					<FilterCredentialsModal isOpen={modalSettings}
						handleClose={handleCloseModal} handleSelect={handleSelectTypes}
						credentialTypes={credentialTypes} selectedCredentialTypes={selectedCredentialTypes}/>
				</div>
			}
		</div>
	);
}

export default MyCredentials;