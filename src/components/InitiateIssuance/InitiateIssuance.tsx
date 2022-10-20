import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import config from '../../config/config.dev';
import { SelectElement } from "../../interfaces/SelectProps";
import CustomSelect from "../CustomSelect/CustomSelect";
import "./InitiateIssuance.css"
import { useSearchParams } from "react-router-dom";
import { authorizationRequest, getIssuerMetadata } from "../../utils/IssuanceUtils";

const InitiateIssuance: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [err, setErr] = useState(false);
	const [step, setStep] = useState<number>(3);

	const [searchParams, setSearchParams] = useSearchParams();
	const [issuerURL, setIssuerURL] = useState("");


	const [credentialTypes, setCredentialTypes] = useState<SelectElement[]>([]);

	useEffect(() => {

		const issuerURL = searchParams.get("issuer");
		if (issuerURL == null) {
			window.location.href = '/error?code=1002';
			return;
		}

		const credentialTypeSchemaURL = searchParams.get("credential_type");

		// if credential type is not defined on the initiation url,
		// then fetch the Issuer Server Metadata
		// IMPORTANT: Currently not implemented
		if (credentialTypeSchemaURL == null) {

			// get issuer metadata based on the issuer url:
			// issue server metadata is usually located at the /.well-known/oauth-authorization-server endpoint
			// according to rfc8414
			axios.get(issuerURL + '/.well-known/oauth-authorization-server').then(res => {
				const metadata = res.data;
				localStorage.setItem("issuerMetadata", JSON.stringify(metadata));

				let credentialsSupported;
				try {
					credentialsSupported = getIssuerMetadata().credentials_supported;
				}
				catch (err) {
					window.location.href = '/error?code=1005';
					return;
				}

				Object.keys(credentialsSupported).map((value) => {
					// fill the credentialTypes variable
				})

			}).catch(e => {
				console.log(e);
			});
		}
		else {
			axios.get(issuerURL + '/.well-known/oauth-authorization-server').then(res => {
				const metadata = res.data;
				localStorage.setItem("issuerMetadata", JSON.stringify(metadata));

				axios.get(credentialTypeSchemaURL).then(res => {
					console.log("Credential schema = ", res.data);
					const title = res.data["title"];
					setCredentialTypes([ { value: 1, label: title } ]);
				});
			});


		}
		// getCountries();
	}, [])

	const prevStep = () => {
		window.location.href = '/';
		// setStep(step => step - 1);
	}

	const nextStep = () => {
		setStep(step => step + 1);
	}

	const handleError = (timeout = 3000) => {
		setErr(true);

		setTimeout(() => {
			setErr(false);
		}, timeout);
	}


	const handleAuthorizationRequest = (issuerUrl: string) => {
		const authorizationResponse = authorizationRequest(issuerUrl);
		if(authorizationResponse.errCode !== 0) {
			window.location.href = `/error?code=${authorizationResponse.errCode}`;
			return;
		}
		if(authorizationResponse.redirectUrl !== undefined) {
			window.location.replace(authorizationResponse.redirectUrl);
			return;
		}
		else {
			window.location.href = `/error?code=${authorizationResponse.errCode}`;
			return;
		}
	}

	return (
		<div className="gunet-container">
			<div className="find-issuer">
				<div className="content">
					{step === 3 &&
						<React.Fragment>
							<h2 className="step-title">{polyglot.t('Wallet.tab4.step3')}</h2>
							<div className="select-container">
								<CustomSelect isMulti={true} items={credentialTypes} onChange={() => { }} />
								{err && <p className={"err"}>{polyglot.t('Wallet.tab4.error3')}</p>}
							</div>
							<div className="buttons">
								<a className="back-link" onClick={prevStep}>
									<span className="fa fa-arrow-left" />
									{polyglot.t('Wallet.tab4.back')}
								</a>
								<a className="next-link" onClick={() => handleAuthorizationRequest(config.devIssuer.usage ? config.devIssuer.url : issuerURL)}>
									{polyglot.t('Wallet.tab4.visitIssuer')}
									<span className="fa fa-arrow-right" />
								</a>
							</div>
						</React.Fragment>
					}
				</div>
			</div>
		</div>
	);
}

export default InitiateIssuance;