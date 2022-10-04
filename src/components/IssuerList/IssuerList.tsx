import axios from "axios";
import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import { IssuerInterface } from "../../interfaces/IssuerInterface";
import config from '../../config/config.dev';
import { SelectElement } from "../../interfaces/SelectProps";
import CustomSelect from "../CustomSelect/CustomSelect";
import Steps from "../Steps/Steps";
import "./IssuerList.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const IssuerList: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const [issuers, setIssuers] = useState<IssuerInterface[]>([]);
    const [countries, setCountries] = useState<SelectElement[]>([]);
    const [step, setStep] = useState<number>(1);

    // getCountries on component load
    useEffect(() => {

        const getCountries = async () => {
            setCountries([{value: 1, label: 'Greece'}, {value: 2, label: 'Italy'}]);
        }
        
        getCountries();
    }, [])
    

    // Convert Issuers to an interface usable by react-select
    const convertIssuersToDropdownItems = (issuers: IssuerInterface[]): SelectElement[] => {
        const dropdownProps: SelectElement[] = [];

        console.log('issuers: ', issuers);

        issuers.forEach(issuer => {
            dropdownProps.push({value: issuer.id, label: issuer.institution});
        });

        return dropdownProps;
    }

    // Fetch Issuers from backend
    const getIssuers = async () => {
        const getInstitutionsRes = await axios.get(`${config.storeBackend.url}/tir/search?institution=`,
					{ headers : {
						Authorization: `Bearer ${localStorage.getItem('appToken')}`
					}}
				);
        if(getInstitutionsRes.status===200 && getInstitutionsRes.data.issuers !== undefined) {
            setIssuers(getInstitutionsRes.data.issuers);
        }
        else {
            console.log('Error fetching trusted issuers from backend');
        }
    }


    const loadIssuersByCountry = async (countryId: number): Promise<void> => {
        await getIssuers().then(() => setStep(2));
    }

    const prevStep = () => {
        setStep(step => step-1);
    }

    return(
        <div className="find-issuer">
            <div className="container">
                <div className="content">
                    <h2 className="container-header">{polyglot.t('Wallet.tab5.title')}</h2>
                    <Steps active={step}
                        steps={[
                            polyglot.t('Wallet.tab5.country'),
                            polyglot.t('Wallet.tab5.institution')
                        ]}
                    />

                    {step===1 &&
                        <React.Fragment>
                            <h2>{polyglot.t('Wallet.tab5.step1')}</h2>

                            <CustomSelect items={countries} onChange={loadIssuersByCountry} />
                        </React.Fragment>
                    }
                    {step===2 &&
                            <div>
                                <h2>{polyglot.t('Wallet.tab5.step2')}</h2>
                                <CustomSelect items={convertIssuersToDropdownItems(issuers)} onChange={()=>{}} />
                            </div>
                    }
                    {step>1 &&
                        <div className="buttons">
                            <a className="back-link" onClick={prevStep}>
																<span className="fa fa-arrow-left" />
                                {polyglot.t('Wallet.tab5.back')}
                            </a>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default IssuerList;