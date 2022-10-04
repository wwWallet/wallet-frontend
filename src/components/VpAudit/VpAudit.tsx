import React, { useEffect, useState } from "react";
import CredentialList, { Credentials, Credential } from "../CredentialList/CredentialList";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import "./VpAudit.css";
import decode from 'jwt-decode';
import { Accordion, Card } from "react-bootstrap";
import moment from 'moment';
import CustomButton from "../Button/CustomButton";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faArrowDown, faArrowUp, faAward, faBars, faClock, faSubscript, faEdit } from '@fortawesome/free-solid-svg-icons'
import Polyglot from "node-polyglot";
import config from "../../config/config.dev";


interface VP {
	id: number;
	did: string;  // holder did  
	vpJWT: string; // actual vp in jwt format
	vpIdentifier: string;
}
const FieldPack = (props: any) => {
	return (
	  <table>
		<tbody>
		  {Object.keys(props.values).map(key => (
			<tr>
			  <td>{props.polyglot.t(key)}</td><td>{props.values[key]}</td>
			</tr>
		  ))}
		</tbody>
	  </table>
	)
  }


interface ExtractedVpFormat {
	containedTypes: string[];
	expiresIn: string; // date in normal format
	issuedAt: string; // date in normal format
	notBefore?: string;
	id: number; // in database
	polyglot: Polyglot
}

// filter presentation by:
// expired and not expired
// issued at (from, to date filters)
// hasType: [diploma, vid, ..other types]
// the type can be derived from the jti of each vc of a presentation
// the jti is a urn which also containes the type.
// 
// !!IMPORTANT: also must check if VCs included in a VP, are still valid (expiration, etc)




const VpCard: React.FC<ExtractedVpFormat> = ({id, issuedAt, expiresIn, containedTypes, polyglot}) => {

	const [open, setOpen] = useState(false);
  
	const toggleOpen = (e: any) => {
	  e.stopPropagation();
	  setOpen(!open);
	}

	return (
	  <div className='diplomabox' >
		<div className='headerbox'>
		  <div className='fields'>
			<span className='field bold'>{polyglot.t('VpCard.presentationId')}: {id}</span>
			<span className='field'>{polyglot.t('VpCard.issuedAt')}: {issuedAt}</span>
		  </div>
		  <div className='action' onClick={toggleOpen}>
			<FontAwesomeIcon className='icon' icon={open ? 'arrow-up' : 'arrow-down'} />
		  </div>
		</div>
		{open && (
		  <div className='details'>
			<div className='detail-scope'>
			  <span className='detail-scope-name'><FontAwesomeIcon icon={'clock'} />{' '}{polyglot.t('VpCard.issuedAt')}</span>
			  <FieldPack polyglot={polyglot} values={{ 'VpCard.issuanceDate': issuedAt, 'VpCard.expirationDate': expiresIn }} />
			</div>
			<div className='detail-scope'>
			  <span className='detail-scope-name'><FontAwesomeIcon icon={'edit'} />{' '} {polyglot.t('VpCard.details') }</span>
			  <FieldPack polyglot={polyglot} values={{ 'VpCard.containedTypes': containedTypes.join(', ') }} />
			</div>
		  </div>
		)}
	  </div>
	)
  }

export const VpAudit: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {
	const currentYear = new Date(new Date()).getFullYear();
	const [startDate, setStartDate] = useState(new Date(currentYear - 5, 1, 1));
	const [endDate, setEndDate] = useState(new Date());
	const [validAt, setValidAt] = useState(new Date(currentYear+1, 1, 1));
	const [availableVcTypes, setAvailableVcTypes] = useState<string[]>([]);
	const [activeVcTypesFilter, setActiveVcTypesFilter] = useState<boolean[]>([]);


	const [presentations, setPresentations] = useState<ExtractedVpFormat[]>([]);
	const [filteredPresentations, setFilteredPresentations] = useState<ExtractedVpFormat[]>([]);

	useEffect(() => {
		axios.post(`${config.storeBackend.vc_storage_url}/vp/logs/get-by-did`,
		{ ebsi_token: localStorage.getItem('ebsi_token') },
		{ 
			headers : {
				Authorization: `Bearer ${localStorage.getItem('appToken')}`
		}})
		.then(res => {
			const vp_list: VP[] = res.data.vp_list;
			let ext_vp_list: ExtractedVpFormat[] = [];
			console.log('full list = ', vp_list)
			const allVcTypes: string[] = [];
			for (let i = 0; i < vp_list.length; i++) {
				const {exp, iat, vp } = decode<{exp: number, iat: number, vp: any}>(vp_list[i].vpJWT);
				var extractedVp: ExtractedVpFormat = { // VP format to be viewed in the browser
					id: vp_list[i].id,
					expiresIn: (new Date(exp*1000)).toString(), // from unix to Date()
					issuedAt: (new Date(iat*1000)).toString(),
					containedTypes: [],
					polyglot: polyglot
				};
				const credJWTlist: any[] = vp.verifiableCredential;
				for (let j = 0; j < credJWTlist.length; j++) {
					const {exp, iat, jti} = decode<{exp: number, iat: number, jti: string}>(credJWTlist[j]);
					if (jti.includes(":vid:")) {
						extractedVp.containedTypes.push("V-ID");
						if (!allVcTypes.includes("V-ID")) allVcTypes.push("V-ID");
					}
					else if (jti.includes(":university:diploma:")) {
						extractedVp.containedTypes.push("University Diploma");
						if (!allVcTypes.includes("University Diploma")) allVcTypes.push("University Diploma");

					}
				}
				ext_vp_list.push(extractedVp);
				
				console.log('contents = ', vp)
			}

			// sort by Issuance date. Latest issued first
			ext_vp_list = ext_vp_list.sort((a: ExtractedVpFormat, b: ExtractedVpFormat) => moment(a.issuedAt).unix() > moment(b.issuedAt).unix() ? -1 : 1)
			setPresentations(ext_vp_list);
			setFilteredPresentations([...ext_vp_list]);
			const vc_second = [...allVcTypes];
			setAvailableVcTypes(vc_second);
			setActiveVcTypesFilter(new Array(vc_second.length).fill(true));
			console.log('Boolean array = ', new Array(vc_second.length).fill(true));
			console.log('VP list  = ', ext_vp_list)
		});
	}, []);




	// function to apply all filters to VP results
	const filterAll = () => {
		console.log('Presentations = ', presentations)
		// initialize
		let newFiltered: ExtractedVpFormat[] = [...presentations];
		console.log('NEW filter', newFiltered)
		// filter based on VC types included in the VPs
		const currentEnabledTypes: string[] = [];
		for (let i = 0; i < availableVcTypes.length; i++) {
			if (activeVcTypesFilter[i] == true) {
				currentEnabledTypes.push(availableVcTypes[i]);
			}
		}
		const newList: ExtractedVpFormat[] = newFiltered.filter(pr => {
			for (let p = 0; p < pr.containedTypes.length; p++) {
				if (currentEnabledTypes.includes(pr.containedTypes[p]))
					return true;
			}
			return false;
		});

		// filter based on Issuance date
		console.log('start or end date is changed')
		const filteredDatesList: ExtractedVpFormat[] = newList.filter(pr => {
			const issAt: Date = new Date(pr.issuedAt);
			console.log('In filter, issAt = ', startDate < issAt && endDate > issAt);
			if (startDate < issAt && endDate > issAt) return true;
			return false;
		});



		//filter based on Expiration date and validity of VCs
		const filterExpired: ExtractedVpFormat[] = filteredDatesList.filter(pr => {
			const expiresIn: Date = new Date(pr.expiresIn);
			if (validAt > expiresIn) return true;
			return false;
		});
		console.log('Last filtered list = ', filterExpired)
		// commit the last filtered list
		setFilteredPresentations(filterExpired);
	}

	// In case any of the filters is changed,
	// then call the filterAll() function to reproduce
	// the presentation list
	useEffect(() => {
		filterAll();
	}, [startDate, endDate, activeVcTypesFilter, validAt])

  const handleOnChange = (position: any) => {
    const updatedCheckedState = activeVcTypesFilter.map((item, index) =>
      index === position ? !item : item
    );
		setActiveVcTypesFilter(updatedCheckedState);
	}


	const showValidOnly = (e: any) => {
		console.log('vallll = ', e.target.checked)
		const isChecked: boolean = e.target.checked;
		if (isChecked) {
			const allPres = [...presentations];
			const filterExpired: ExtractedVpFormat[] = allPres.filter(pr => {
				const expiresIn: Date = new Date(pr.expiresIn);
				if (new Date() < expiresIn) return true;  // if already expired
				return false;
			});
			setFilteredPresentations(filterExpired);
		}
		else {
			filterAll();
		}
	}

	return (
		<>
			<h3 className="cntr">{polyglot.t('Audit.header')}</h3>
			{polyglot.t('Audit.range')} <br/>
			{polyglot.t('Audit.from')}: <DatePicker dateFormat="dd/MM/yyyy" selected={startDate} onChange={(date: Date) => setStartDate(date)} />
			{polyglot.t('Audit.to')}: <DatePicker dateFormat="dd/MM/yyyy" selected={endDate} onChange={(date: Date) => setEndDate(date)} />
			<br />
			<br />
			<Accordion defaultActiveKey="0">
				<Accordion.Item eventKey="0">
					<Accordion.Header>{polyglot.t('Audit.filter')}</Accordion.Header>
					<Accordion.Body>
						{availableVcTypes.map((vcType: string, index: any) => {
							return (
								<>
									<input type="checkbox"
													id={index}
													name={index}
													value={vcType}
													defaultChecked={true}
													checked={activeVcTypesFilter[index]}
													onChange={() => handleOnChange(index)}/>
									<label htmlFor={"vc"+index}>&nbsp; &nbsp; &nbsp;{vcType}</label><br/>
								</>
							);
						})}
						
					</Accordion.Body>
				</Accordion.Item>
			</Accordion>
			<br/>
			{polyglot.t('Audit.validAt')}: 
			<DatePicker dateFormat="dd/MM/yyyy" selected={validAt} onChange={(date: Date) => setValidAt(date)} />

			<div style={{marginTop: '10px'}}>
				<input type={'checkbox'} id="show-valid-only" name="show-valid-only" onChange={showValidOnly} />
				<span style={{'marginLeft': '10px'}}>{polyglot.t('Audit.nonExpired')}</span>
			</div>
			
			{filteredPresentations.map((presentation: ExtractedVpFormat, index: any) => {
				return (
					<div key={"vc"+index} id={"vc"+index} style={{marginTop: '20px'}}>
						<VpCard id={presentation.id}
								issuedAt={presentation.issuedAt}
								expiresIn={presentation.expiresIn}
								containedTypes={presentation.containedTypes}
								polyglot={presentation.polyglot} />
					</div>
				);
			})}
		</>
	);
}

export default VpAudit;