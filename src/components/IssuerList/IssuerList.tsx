import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import { IssuerInterface } from "../../interfaces/IssuerInterface";
import config from '../../config/config.dev';
import { SelectElement } from "../../interfaces/SelectProps";
import CustomSelect from "../CustomSelect/CustomSelect";
import Steps from "../Steps/Steps";
import "./IssuerList.css"

const IssuerList: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [issuers, setIssuers] = useState<IssuerInterface[]>([]);
	const [countries, setCountries] = useState<SelectElement[]>([]);
	const [err, setErr] = useState(false);
	const [step, setStep] = useState<number>(1);

	const [country, setCountry] = useState("");
	const [institution, setInstitution] = useState("");

	// getCountries on component load
	useEffect(() => {

		const getCountries = async () => {
			setCountries([{ value: 'Greece', label: 'Greece' }, { value: 'Italy', label: 'Italy' }]);
		}

		getCountries();
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
		if(country === "")
			handleError();
		else {
			await getIssuersByCountry(country);
			nextStep();
		}
	}

	const loadInstitutionMetadata = async (): Promise<void> => {
		if(institution === "")
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

		// acqired from wallet store
		localStorage.setItem('issuerUrl', issuerUrl);
		if (config.devIssuer.usage) {
			localStorage.setItem('issuedDid', config.devIssuer.did);
		}
		else {
			localStorage.setItem('issuerDid', "")
		}

		// this endpoint is meant to be fetched from the server metadata, once we know the server metadata url of the issuer
		let authorizationEndpoint = "";
		if (config.devIssuer.usage == true) {
			authorizationEndpoint = config.devIssuer.authorizationEndpoint;
		}
		const redirectUrl = new URL(authorizationEndpoint);

		redirectUrl.searchParams.append('response_type', 'code');
		redirectUrl.searchParams.append('client_id', config.oid4ci.redirectUri);
		redirectUrl.searchParams.append('state', state);
		console.log("Authorizatio det: ", config.devConformance.authorization_details)
		if (config.devConformance.usage == true)
			redirectUrl.searchParams.append('authorization_details', config.devConformance.authorization_details);
		else
			redirectUrl.searchParams.append('authorization_details', `%5B%7B%22type%22%3A%22openid_credential%22%2C%22credential_type%22%3A%22https%3A%2F%2Fapi.preprod.ebsi.eu%2Ftrusted-schemas-registry%2Fv1%2Fschemas%2F0x1ee207961aba4a8ba018bacf3aaa338df9884d52e993468297e775a585abe4d8%22%2C%22format%22%3A%22jwt_vc%22%7D%5D`);
		redirectUrl.searchParams.append('redirect_uri', config.oid4ci.redirectUri);
		redirectUrl.searchParams.append('scope', 'openid')
		// window.location.replace(redirectUrl);
		console.log('URL = ', redirectUrl.toString())
		// axios.get(redirectUrl.toString(), {headers: {Conformance: config.devConformance.conformanceHeader}}).then(result => {
		// 	console.log('Result data = ', result.data)
		// }).catch(e => {
		// 	console.log('errs = ', e)
		// })

		fetch(redirectUrl, {
			headers: {Conformance: config.devConformance.conformanceHeader}
		}).then(res => {
			console.log("Result = ", res)
			window.location.href = res.url
		})
	}

	return (
		<div className="find-issuer">
			<div className="content">
				<h2 className="container-header">{polyglot.t('Wallet.tab4.title')}</h2>
				<Steps active={step}
					steps={[
						polyglot.t('Wallet.tab4.country'),
						polyglot.t('Wallet.tab4.institution'),
						polyglot.t('Wallet.tab4.type')
					]}
				/>

				{step === 1 &&
					<React.Fragment>
						<h2>{polyglot.t('Wallet.tab4.step1')}</h2>
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
						<h2>{polyglot.t('Wallet.tab4.step2')}</h2>
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
				}
				{step === 3 &&
					<React.Fragment>
						<h2>{polyglot.t('Wallet.tab4.step3')}</h2>
						<div className="select-container">
							<CustomSelect isMulti={true} items={[]} onChange={() => { }} />
							{err && <p className={"err"}>{polyglot.t('Wallet.tab4.error3')}</p>}
							</div>
							<div className="buttons">
								<a className="back-link" onClick={prevStep}>
									<span className="fa fa-arrow-left" />
									{polyglot.t('Wallet.tab4.back')}
								</a>
								<a className="next-link" onClick={() => authorizationRequest(config.devIssuer.usage ? config.devIssuer.url : 'http://issuer.must.be.selected')}>
									{polyglot.t('Wallet.tab4.visitIssuer')}
									<span className="fa fa-arrow-right" />
								</a>
							</div>
					</React.Fragment>
				}
			</div>
		</div>
	);
}

export default IssuerList;