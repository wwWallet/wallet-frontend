import config from "../../config/config.dev";
import axios from "axios";
import Polyglot from "node-polyglot";
import decode from 'jwt-decode';
import React, { useEffect, useState } from "react";
import CredentialList from "../CredentialList/CredentialList";
import { CredentialEntity } from "../../interfaces/credential.interface";
import Modal from 'react-modal';
import './MyCredentials.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTimes } from "@fortawesome/free-solid-svg-icons";
import CustomSelect from "../CustomSelect/CustomSelect";

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

	return (
		<div className="gunet-container">
			{message ?
				<React.Fragment>
					<div className="message">{message}</div>
					<br />
					{/* <button
						className="login-button ui fancy button"
						onClick={() => { window.location.href = '/' }}>
						{polyglot.t('Wallet.tab1.vidButton')} {' '}
					</button> */}
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

					<Modal
						className="my-modal"
						overlayClassName="my-modal-wrapper"
						isOpen={modalSettings}
						ariaHideApp={false}
						onRequestClose={handleCloseModal}
					>
						<div className="modal-header">
							<h4>Filter Credentials</h4>
							<button type="button" id="close" onClick={handleCloseModal}>
								<FontAwesomeIcon className="CloseModal" icon={faTimes} />
							</button>
						</div>
						<div className='content'>
							<div className="filter-vc-container">
									Credential Type:
									<CustomSelect items={[{value: 'All', label: 'All'}, {value: 'Europass', label: 'Europass'}]} onChange={ () => {}}/>
									<button
										className="small login-button ui fancy button authorize-btn"
										onClick={ () => {handleCloseModal()} }>
										Apply
									</button>
								</div>
						</div>
					</Modal>
				</div>
			}
		</div>
	);
}

export default MyCredentials;