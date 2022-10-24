import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import config from "../../config/config.dev";
import { CredentialEntity } from "../../interfaces/credential.interface";
// import { removeElementFromStringArray } from "../../utils/GeneralUtils";
import SelectableCredentialList from "./SelectableCredentialList";

const Authorize: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [credentials, setCredentials] = useState<any[]>([]);

	const [selected, setSelected] = useState<string[]>([]);

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

	const handleSelectVc = (credentialId: string) => {
		setSelected((vcs) => vcs = [...vcs, credentialId]);
	}

	const handleDeselectVc = (credentialId: string) => {
		setSelected((vcs) => removeElementFromStringArray(vcs, credentialId));
	}

	const removeElementFromStringArray = (array: string[], elem: string): string[] => {
		const index: number = array.indexOf(elem);
		let newArray: string[] = array.slice(); // copy array
		newArray.splice(index, 1);	// remove that element
		return newArray;
	}

	return (
		<div className="gunet-container">
			<h1>{polyglot.t('Authz.title')}</h1>
			<p>{polyglot.t('Authz.description1')}</p>
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
					<SelectableCredentialList polyglot={polyglot} credentials={credentials.slice(0,2)} loaded={loading}
						handleSelectVc={handleSelectVc} handleDeselectVc={handleDeselectVc}
					/>
					{!credentials.length && !loading &&
						<div className="message">
							{polyglot.t('Wallet.tab1.emptyVC')}
						</div>
					}
					<button
						className="login-button ui fancy button"
						onClick={() => { console.log('Selected VCs: ', selected) }}>
						{polyglot.t('Authz.buttonAuthorize')}
					</button>
				</div>
			}
		</div>
	);
}

export default Authorize;