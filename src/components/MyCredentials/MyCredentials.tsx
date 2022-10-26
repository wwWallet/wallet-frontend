import config from "../../config/config.dev";
import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import CredentialList from "../CredentialList/CredentialList";
import { CredentialEntity } from "../../interfaces/credential.interface";
import './MyCredentials.css';
import FilterCredentialsModal from "../Modals/FilterCredentialsModal";
import { SelectElement } from "../../interfaces/SelectProps";

const MyCredentials: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [credentials, setCredentials] = useState<any[]>([]);


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
		setLoading(true);
		axios.get<{vc_list: CredentialEntity[]}>(config.storeBackend.vcStorageUrl + '/vc',
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`
				}
			}
		).then(res => {
			const fetchedCredentials: any[] = res.data.vc_list;

			// for (let i = 0; i < res.data.vc_list.length; i++) {
			// 	const { vc } = decode<{ vc: any }>(res.data.vc_list[i].jwt);
			// 	fetchedCredentials.push(vc);
			// }
			console.log("Credentials = ", res.data)
			setCredentials(fetchedCredentials);
			if (fetchedCredentials.length == 0) {
				setMessage(polyglot.t('Wallet.tab1.emptyVC'));
			}
			setLoading(true);

		});
	}, []);

	const credentialTypes: SelectElement[] = [{value: 'All', label: 'All'}, {value: 'Europass', label: 'Europass'}];

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
						<span className="hamburger fa fa-cog" onClick={handleOpenModal}/>
					</div>
					<CredentialList polyglot={polyglot} credentials={credentials} loaded={loading} />
					{!credentials.length && !loading &&
						<div className="message">
							{polyglot.t('Wallet.tab1.emptyVC')}
						</div>
					}
					<FilterCredentialsModal isOpen={modalSettings} handleClose={handleCloseModal} credentialTypes={credentialTypes} />
				</div>
			}
		</div>
	);
}

export default MyCredentials;