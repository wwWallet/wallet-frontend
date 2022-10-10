import config from "../../config/config.dev";
import axios from "axios";
import Polyglot from "node-polyglot";
import decode from 'jwt-decode';
import React, { useEffect, useState } from "react";
import CredentialList, { CredentialEntity } from "../CredentialList/CredentialList";

const MyCredentials: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [credentials, setCredentials] = useState<any[]>([]);

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
					<CredentialList polyglot={polyglot} credentials={credentials} loaded={loading} />
					{!credentials.length && !loading &&
						<div className="message">
							{polyglot.t('Wallet.tab1.emptyVC')}
						</div>
					}
				</div>
			}
		</div>
	);
}

export default MyCredentials;