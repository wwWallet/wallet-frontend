import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import { IssuerInterface } from "../../interfaces/IssuerInterface";
import config from '../../config/config.dev';
import { SelectElement } from "../../interfaces/SelectProps";
import CustomSelect from "../CustomSelect/CustomSelect";
import Steps from "../Steps/Steps";
import "./InitiateIssuance.css"
import { useSearchParams } from "react-router-dom";
import { getIssuerMetadata } from "../Consent/Consent";

const InitiateIssuance: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [issuers, setIssuers] = useState<IssuerInterface[]>([]);
	const [countries, setCountries] = useState<SelectElement[]>([]);
	const [err, setErr] = useState(false);
	const [step, setStep] = useState<number>(3);

	const [country, setCountry] = useState("");
	const [institution, setInstitution] = useState("");

	const [searchParams, setSearchParams] = useSearchParams();
	const [issuerURL, setIssuerURL] = useState("");
	// const issuerURL = searchParams.get("issuer");
	// if (issuerURL == null) {
	// 	window.location.href = '/';
	// 	return;
	// }
	// getCountries on component load


	const [credentialTypes, setCredentialTypes] = useState<SelectElement[]>([]);

	useEffect(() => {

		const getCountries = async () => {
			setCountries([{ value: 'Greece', label: 'Greece' }, { value: 'Italy', label: 'Italy' }]);
		}

		const issuerURL = searchParams.get("issuer");
		if (issuerURL == null) {
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

				let credentialsSupported = getIssuerMetadata().credentials_supported;
				Object.keys(credentialsSupported).map((value) => {
					// fill the credentialTypes variable
				})

			}).catch(e => {
				console.log(e);	
			});
		}
		else {
			axios.get(credentialTypeSchemaURL).then(res => {
				console.log("Credential schema = ", res.data);
				const title = res.data["title"];
				setCredentialTypes([ { value: 1, label: title } ]);
			})
		}
		// getCountries();
	}, [])


	// Convert Issuers to an interface usable by react-select
	const convertIssuersToDropdownItems = (issuers: IssuerInterface[]): SelectElement[] => {
		const dropdownProps: SelectElement[] = [];

		console.log('issuers: ', issuers);

		issuers.forEach(issuer => {
			dropdownProps.push({ value: issuer.id, label: issuer.institution });
		});

		return dropdownProps;
	}

	// Fetch Issuers from backend
	const getIssuersByCountry = async (country: string) => {
		console.log('country: ', country);
		const getInstitutionsRes = await axios.get(`${config.storeBackend.url}/tir/search?country=${country}`,
			{
				headers: {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`
				}
			}
		);
		if (getInstitutionsRes.status === 200 && getInstitutionsRes.data.issuers !== undefined) {
			setIssuers(getInstitutionsRes.data.issuers);
		}
		else {
			console.log('Error fetching trusted issuers from backend');
		}
	}


	const loadIssuersByCountry = async (): Promise<void> => {
		if (country === "")
			handleError();
		else {
			await getIssuersByCountry(country);
			nextStep();
		}
	}

	const loadInstitutionMetadata = async (): Promise<void> => {
		if (institution === "")
			handleError();
		else {
			// get institution metadata for next step
			nextStep();
		}
	}

	const prevStep = () => {
		setStep(step => step - 1);
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

	const authorizationRequest = (issuerUrl: string) => {

		const state: string = "secret";
		localStorage.setItem('state', state);

		localStorage.setItem('issuerUrl', issuerUrl);

		// this endpoint is meant to be fetched from the server metadata, once we know the server metadata url of the issuer
		let authorizationEndpoint = getIssuerMetadata().authorization_endpoint;
		if (config.devIssuer.usage == true) {
			authorizationEndpoint = config.devIssuer.authorizationEndpoint;
		}
		const redirectUrl = new URL(authorizationEndpoint);

		redirectUrl.searchParams.append('response_type', 'code');
		redirectUrl.searchParams.append('client_id', config.oid4ci.redirectUri);
		redirectUrl.searchParams.append('state', state);
		if (config.devConformance.usage == true)
			redirectUrl.searchParams.append('authorization_details', config.devConformance.authorization_details);
		else
			redirectUrl.searchParams.append('authorization_details', `%5B%7B%22type%22%3A%22openid_credential%22%2C%22credential_type%22%3A%22https%3A%2F%2Fapi.preprod.ebsi.eu%2Ftrusted-schemas-registry%2Fv1%2Fschemas%2F0x1ee207961aba4a8ba018bacf3aaa338df9884d52e993468297e775a585abe4d8%22%2C%22format%22%3A%22jwt_vc%22%7D%5D`);
		redirectUrl.searchParams.append('redirect_uri', config.oid4ci.redirectUri);
		redirectUrl.searchParams.append('scope', 'openid');
		// window.location.replace(redirectUrl);
		console.log('URL = ', redirectUrl.toString())
		window.location.replace(redirectUrl);

		// fetch(redirectUrl, {
		// 	headers: {Conformance: config.devConformance.conformanceHeader}
		// }).then(res => {
		// 	console.log("Result = ", res)
		// 	window.location.href = res.url
		// })
	}

	return (
		<div className="gunet-container">
			<div className="find-issuer">
				<div className="content">
					{/* <h2 className="container-header step-title">{polyglot.t('Wallet.tab4.title')}</h2> */}
					{/* <Steps active={step}
					steps={[
						polyglot.t('Wallet.tab4.country'),
						polyglot.t('Wallet.tab4.institution'),
						polyglot.t('Wallet.tab4.type')
					]}
				/> */}

					{/* {step === 1 &&
					<React.Fragment>
						<h2 className="step-title">{polyglot.t('Wallet.tab4.step1')}</h2>
						<div className="select-container">
							<CustomSelect err={err} items={countries} onChange={(country) => setCountry(country.label)} />
							{err && <p className={"err"}>{polyglot.t('Wallet.tab4.error1')}</p>}
						</div>
							<div className="buttons">
								<a className="back-link" style={{ visibility: "hidden" }} onClick={prevStep}>
									<span className="fa fa-arrow-left" />
									{polyglot.t('Wallet.tab4.back')}
								</a>
								<a className="next-link" onClick={loadIssuersByCountry}>
									{polyglot.t('Wallet.tab4.next')}
									<span className="fa fa-arrow-right" />
								</a>
							</div>
					</React.Fragment>
				}
				{step === 2 &&
					<React.Fragment>
						<h2 className="step-title">{polyglot.t('Wallet.tab4.step2')}</h2>
						<div className="select-container">
							<CustomSelect err={err} items={convertIssuersToDropdownItems(issuers)} onChange={(inst) => setInstitution(inst.label)} />
							{err && <p className={"err"}>{polyglot.t('Wallet.tab4.error2')}</p>}
							</div>
							<div className="buttons">
								<a className="back-link" onClick={prevStep}>
									<span className="fa fa-arrow-left" />
									{polyglot.t('Wallet.tab4.back')}
								</a>
								<a className="next-link" onClick={loadInstitutionMetadata}>
									{polyglot.t('Wallet.tab4.next')}
									<span className="fa fa-arrow-right" />
								</a>
							</div>
					</React.Fragment>
				} */}
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
								<a className="next-link" onClick={() => authorizationRequest(config.devIssuer.usage ? config.devIssuer.url : issuerURL)}>
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