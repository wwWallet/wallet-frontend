import jwtDecode from 'jwt-decode';
import React, { useEffect, useState } from 'react'
import { CredentialEntity } from '../CredentialList/CredentialList';
import './VC.css';
const credential = {
	id: "urn:id:222323",
	credentialSubject: {
		id: "urn:diploma:123xxx",
		wasAcquired: {
			date: "2212334324",
			country: "Greece",
			institution: {
				"UOA": "GReece"
			}
		},
		arr: [
			{ "atr1": { sub: "sub valu"} },
			{ "atr2": "val2" }
		]
	}
}



// const credential = 
// function renderSingleObject

function styleAccordingToDepth(name: string, depth: number): JSX.Element {
	if (depth == 0) {
		return <h1>{name}</h1>
	}
	if (depth == 1) {
		return <h2>{name}</h2>	
	}
	if (depth == 2) {
		return <h3>{name}</h3>
	}
	if (depth == 3) {
		return <h4>{name}</h4>
	}
	else {
		return <div>{name}</div>
	}
}

function generateDataFromVC(object: any, depth: number): JSX.Element {
  if (!object) { return <></> }

  if (typeof object === 'string' || typeof object === "number") {
    return <p>{object} <br/></p>
  }

	if (Array.isArray(object)) {
		let i = 0;
		let parsedData: JSX.Element = <>
			{object.map((value: any) => {
				return <div key={i++}> 
					{generateDataFromVC(value, depth+1)}
					<br />
				</div>
			})}
		</>
		return parsedData;
	}


	let parsedData: JSX.Element = <>
		{/* if typeof object[key] is not 'object' then render it first */}
		{/* For each key, render the object of that key */}
		{Object.keys(object).sort((a: string, b: string) => typeof object[a] == 'object' ? 1 : -1).map((key: any) => {
			return <div key={key}>
				{ ['string', 'number'].includes(typeof object[key]) ? <></> : styleAccordingToDepth(key, depth) }
				{ ['string', 'number'].includes(typeof object[key]) ? <div className='layout'><div>{key + ": "} </div><div>{object[key]}</div></div> : generateDataFromVC(object[key], Array.isArray(object[key]) ? depth : depth+1) }
				<br />
			</div>
		})}
	</>;
  return parsedData
}

const VC: React.FC<{credential: CredentialEntity}> = ({credential}) => {

	const [vc, setVc] = useState({});
	useEffect(() => {
		const content = jwtDecode(credential.jwt) as any
		setVc(content.vc)
	}, [])
	return <>
		<div id="VC">

			{generateDataFromVC(vc, 0)}
		</div>
	</>
}

export default VC;