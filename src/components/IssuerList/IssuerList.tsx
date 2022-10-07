import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import { IssuerInterface } from "../../interfaces/IssuerInterface";
import config from '../../config/config.dev';
import { SelectElement } from "../../interfaces/SelectProps";
import CustomSelect from "../CustomSelect/CustomSelect";
import Steps from "../Steps/Steps";
import "./IssuerList.css"
import CustomButton from "../Button/CustomButton";

const IssuerList: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [issuers, setIssuers] = useState<IssuerInterface[]>([]);
	const [countries, setCountries] = useState<SelectElement[]>([]);
	const [country, setCountry] = useState("");
	const [step, setStep] = useState<number>(1);

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
		console.log('loadingissuersByCountry', country);
		await getIssuersByCountry(country).then(() => setStep(2));
	}

	const prevStep = () => {
		setStep(step => step - 1);
	}

	const nextStep = () => {
		setStep(step => step + 1);
	}

	const authorizationRequest = (issuerUrl: string) => {

		const state: string = "secret";
		localStorage.setItem('state', state);
		localStorage.setItem('issuerUrl', issuerUrl);
		localStorage.setItem('issuerDid', 'did:ebsi:zfGwMsrwZjJgpj6NmnjFMXM');

		const redirectUrl = new URL(`${issuerUrl}/issuer/authorize`);

		redirectUrl.searchParams.append('response_type', 'code');
		redirectUrl.searchParams.append('client_id', `${config.host}/consent`);
		redirectUrl.searchParams.append('state', state);
		redirectUrl.searchParams.append('authorization_details', `%5B%7B%22type%22%3A%22openid_credential%22%2C%22credential_type%22%3A%22https%3A%2F%2Fapi.preprod.ebsi.eu%2Ftrusted-schemas-registry%2Fv1%2Fschemas%2F0x1ee207961aba4a8ba018bacf3aaa338df9884d52e993468297e775a585abe4d8%22%2C%22format%22%3A%22jwt_vc%22%7D%5D`);
		redirectUrl.searchParams.append('redirect_uri', `${config.host}/consent`);
		window.location.replace(redirectUrl);
	}

	return (
		<div className="find-issuer">
			<div className="container">
				<div className="content">
					<h2 className="container-header">{polyglot.t('Wallet.tab5.title')}</h2>
					<Steps active={step}
						steps={[
							polyglot.t('Wallet.tab5.country'),
							polyglot.t('Wallet.tab5.institution'),
							polyglot.t('Wallet.tab5.type')
						]}
					/>

					{step === 1 &&
						<React.Fragment>
							<h2>{polyglot.t('Wallet.tab5.step1')}</h2>
							<CustomSelect items={countries} onChange={(country) => { console.log(country); setCountry(country.label); }} />
							<div className="buttons">
								<a className="back-link" onClick={loadIssuersByCountry}>
									<span className="fa fa-arrow-right" />
									{polyglot.t('Wallet.tab5.next')}
								</a>
							</div>
						</React.Fragment>
					}
					{step === 2 &&
						<React.Fragment>
							<h2>{polyglot.t('Wallet.tab5.step2')}</h2>
							<CustomSelect items={convertIssuersToDropdownItems(issuers)} onChange={() => { }} />
							<div className="buttons">
								<a className="back-link" onClick={prevStep}>
									<span className="fa fa-arrow-left" />
									{polyglot.t('Wallet.tab5.back')}
								</a>
								<a className="back-link" onClick={nextStep}>
									<span className="fa fa-arrow-right" />
									{polyglot.t('Wallet.tab5.next')}
								</a>
							</div>
						</React.Fragment>
					}
					{step === 3 &&
						<div>
							<h2>{polyglot.t('Wallet.tab5.step3')}</h2>
							<CustomSelect isMulti={true} items={[]} onChange={() => { }} />
							<CustomButton buttonDisabled={false} text={"Visit Issuer"}
								onClick={() => authorizationRequest('http://195.134.100.169:8000')}
							/>
						</div>
					}
					{/* <div className="buttons">
						{step > 1 &&
							<a className="back-link" onClick={prevStep}>
								<span className="fa fa-arrow-left" />
								{polyglot.t('Wallet.tab5.back')}
							</a>
						}
						{step < 3 &&
							<a className="back-link" onClick={nextStep}>
								<span className="fa fa-arrow-right" />
								{polyglot.t('Wallet.tab5.next')}
							</a>
						}
					</div> */}
				</div>
			</div>
		</div>
	);
}

export default IssuerList;