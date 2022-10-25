import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import config from "../../config/config.dev";
import { CredentialEntity } from "../../interfaces/credential.interface";
import { removeElementFromStringArray } from "../../utils/GeneralUtils";
import SelectableCredentialList from "./SelectableCredentialList";
import './Authorize.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons'
import { CreateVpRequestDTO } from "../../interfaces/presentation.interface";

const Authorize: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [credentials, setCredentials] = useState<any[]>([]);

	const [selected, setSelected] = useState<string[]>([]);

	// store search params
	const presentation_definition = searchParams.get('presentation_definition');
	const nonce = searchParams.get('nonce');
	if (nonce == null || nonce === "") {
		throw new Error("Errror no NONCE was provided");
	}
	const conformance = searchParams.get('conformance');
	const redirect_uri = searchParams.get('redirect_uri');
	if (redirect_uri == null || redirect_uri === "") {
		throw new Error("Redirect uri is empty");
	}
	const scope = searchParams.get('scope');

	// load credentials from db
	useEffect(() => {
		setLoading(true);
		const url = new URL(config.storeBackend.vcStorageUrl + '/vc')
		if (presentation_definition != null)
			url.searchParams.append('presentation_definition', presentation_definition);
		// get vcs that conform with the presentation_definition object

		const axiosOptions = {headers: { Authorization: `Bearer ${localStorage.getItem('appToken')}`}}
		axios.get<{vc_list: CredentialEntity[]}>(url.toString(), axiosOptions).then(res => {
			const fetchedCredentials: CredentialEntity[] = res.data.vc_list;
			console.log("Credentials = ", res.data);
			setCredentials(fetchedCredentials);
			if (fetchedCredentials.length == 0) {
				setMessage(polyglot.t('Wallet.tab1.emptyVC'));
			}
			setLoading(true);
		});

	}, []);

	const sendPresentation = () => {
		const selectedCredentialEntities: CredentialEntity[] = credentials.filter((credential: CredentialEntity) => {
			return selected.includes(credential.identifier);
		});

		const requestBody: CreateVpRequestDTO = {
			alg: "ES256K",
			credentialEntities: selectedCredentialEntities,
			nonce: nonce,
			audience: redirect_uri,
			format: "jwt_vp"
		};
		const axiosOptions = {headers: { Authorization: `Bearer ${localStorage.getItem('appToken')}`}}
		axios.post<{vp_jwt: string}>(config.signatoryBackend.url + '/signing', requestBody, axiosOptions).then(res => {
			const { vp_jwt } = res.data;
			console.log("vp jwt = ", vp_jwt)
			axios.post(redirect_uri, { vp_token: vp_jwt }).then(res => {

				// render the results of the verification to the user
				console.log("Verification results = ", res.data);
				window.location.href = '/verification/results';
			});
		});
	}

	const handleSelectVc = (credentialId: string) => {
		setSelected((vcs) => vcs = [...vcs, credentialId]);
	}

	const handleDeselectVc = (credentialId: string) => {
		setSelected((vcs) => removeElementFromStringArray(vcs, credentialId));
	}


	return (
		<div className="gunet-container">
			<h1>{polyglot.t('Authz.title')}</h1>
			<p>{polyglot.t('Authz.description1')}</p>
			<p className="presentationDisclaimer">
				<FontAwesomeIcon className="disclaimerIcon" icon={faExclamationCircle} />
				{polyglot.t('Authz.description2')}
			</p>
			{message ?
				<React.Fragment>
					<div className="message">{message}</div>
				</React.Fragment>
				:
				<div className="AuthorizeSplit">
					<div className="AuthorizeContent">
						{/* <h4>{polyglot.t('Wallet.tab1.verifiableCredentials')}</h4> */}
						<SelectableCredentialList polyglot={polyglot} credentials={credentials} loaded={loading}
							handleSelectVc={handleSelectVc} handleDeselectVc={handleDeselectVc}
						/>
						{!credentials.length && !loading &&
							<div className="message">
								{polyglot.t('Wallet.tab1.emptyVC')}
							</div>
						}
					</div>
					<div className="AuthorizeButton">
						<button
							className="login-button ui fancy button authorize-btn"
							onClick={ () => sendPresentation()}>
							{polyglot.t('Authz.buttonAuthorize')}
						</button>
					</div>
					<button
						className="authorize-bar"
						onClick={ () => sendPresentation()}>
						{polyglot.t('Authz.buttonAuthorize')}
					</button>
				</div>
			}
		</div>
	);
}

export default Authorize;