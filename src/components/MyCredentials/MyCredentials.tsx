import config from "../../config/config.dev";
import axios from "axios";
import Polyglot from "node-polyglot";
import decode from 'jwt-decode';
import { useEffect, useState } from "react";
import SeparatedCredentials from "../SeparatedCredentials/SeparatedCredentials";

const MyCredentials: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [credentials, setCredentials] = useState<any[]>([]);

	// load credentials from db
	useEffect(() => {
		setLoading(true);
		axios.get(config.storeBackend.vc_storage_url + '/vc',
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`
				}
			}
		).then(res => {
			const fetchedCredentials: any[] = [];

			// for (let i = 0; i < res.data.vc_list.length; i++) {
			// 	const { vc } = decode<{ vc: any }>(res.data.vc_list[i].jwt);
			// 	fetchedCredentials.push(vc);
			// }

			setCredentials(fetchedCredentials);
			if (fetchedCredentials.length == 0) {
				setMessage(polyglot.t('Wallet.tab1.emptyVC'));
			}
			setLoading(true);

		});
	}, []);

	return (
		<div className="gunet-container">
			<div>
				{message ?
					<>
						<div className="message">{message}</div>
						<span>{polyglot.t('Wallet.tab1.vidPrompt')}</span>
						<br />
						<button
							className="login-button ui fancy button"
							onClick={() => { window.location.href = '/' }}>
							{polyglot.t('Wallet.tab1.vidButton')} {' '}
						</button>
					</>
					: <SeparatedCredentials polyglot={polyglot} credentials={credentials} loaded={loading} />
				}

			</div>
		</div>
	);
}

export default MyCredentials;