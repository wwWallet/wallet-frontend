import jwtDecode from 'jwt-decode';
import React, { useEffect, useState } from 'react'
import { CredentialEntity } from '../CredentialList/CredentialList';
import './VC.css';

// const credential = {
// 	id: "urn:id:222323",
// 	credentialSubject: {
// 		id: "urn:diploma:123xxx",
// 		wasAcquired: {
// 			date: "2212334324",
// 			country: "Greece",
// 			institution: {
// 				"UOA": "GReece"
// 			}
// 		},
// 		arr: [
// 			{ "atr1": { sub: "sub valu"} },
// 			{ "atr2": "val2" }
// 		]
// 	}
// }

// function styleAccordingToDepth(name: string, depth: number, innerRoute: any): JSX.Element {
// 	if (depth == 0) {
// 		return <h1 onClick={() => innerRoute(name)}>{name}</h1>
// 	}
// 	if (depth == 1) {
// 		return <h2>{name}</h2>
// 	}
// 	if (depth == 2) {
// 		return <h3>{name}</h3>
// 	}
// 	if (depth == 3) {
// 		return <h4>{name}</h4>
// 	}
// 	if (depth == 4) {
// 		return <h5>{name}</h5>
// 	}
// 	else {
// 		return <div>{name}</div>
// 	}
// }

// function generateDataFromVC(object: any, depth: number, innerRoute: any): JSX.Element {
// 	console.log('gen', object)
// 	if (!object) { return <></> }
// 	console.log('okkk')

// 	if (typeof object === 'string' || typeof object === "number") {
// 		return <p className={`l${depth}`}>{object} {/*<br />*/}</p>
// 	}

// 	if (Array.isArray(object)) {
// 		let i = 0;
// 		let parsedData: JSX.Element = <>
// 			{object.map((value: any) => {
// 				return <div key={i++}>
// 					{generateDataFromVC(value, depth + 1, innerRoute)}
// 					{/* <br /> */}
// 				</div>
// 			})}
// 		</>
// 		return parsedData;
// 	}


// 	let parsedData: JSX.Element = <>
// 		{/* if typeof object[key] is not 'object' then render it first */}
// 		{/* For each key, render the object of that key */}
// 		{Object.keys(object).sort((a: string, b: string) => typeof object[a] == 'object' ? 1 : -1).map((key: any) => {
// 			return <div key={key}>
// 				{['string', 'number'].includes(typeof object[key]) ? <></> : styleAccordingToDepth(key, depth, innerRoute)}
// 				{['string', 'number'].includes(typeof object[key]) ? <div className={`layout l${depth}`}><strong>{key + ": "} </strong><div>{object[key]}</div></div> : generateDataFromVC(object[key], Array.isArray(object[key]) ? depth : depth + 1, innerRoute)}
// 				{/* <br /> */}
// 			</div>
// 		})}
// 	</>;
// 	return parsedData
// }

const VC: React.FC<{ credential: any, handleSetPath(value: string): void, name?: string }> = ({ credential, name, handleSetPath }) => {

	// const innerRoute = (name: string) => {

	// 	setVcRoute((vcRoute: string) => {
	// 		vcRoute = `${vcRoute}.${name}`;
	// 	})
	// }

	var i: number = 0;

	// const [vc, setVc] = useState({});
	const [displayedVc, setDisplayedVc] = useState<any>(undefined);
	// const [vcRoute, setVcRoute] = useState("");


	useEffect(() => {

		if (typeof credential == 'object') {
			const obj: any = Object.keys(credential).map(
				(value) => {
					console.log(credential[value]);
					if (typeof credential[value] == 'object') {

						if (Array.isArray(credential[value])) {
							const len: number = credential[value].length
							return (
								<div className="card obj-card" key={i++} onClick={() => handleSetPath(value)}>
									<div className="key">{value}</div>
									<div className="value">{`Array with ${len} object${len != 1 ? 's' : ''}`}</div>
								</div>
							);
						}

						else {
							const len: number = Object.keys(credential[value]).length;
							return (
								<div className="card obj-card" key={i++} onClick={() => handleSetPath(value)}>
									<div className="key">{value}</div>
									<div className="value">{`Object with ${len} attribute${len != 1 ? 's' : ''}`}</div>
								</div>
							);
						}
					}
					else {
						return (
							<div className="card val-card" key={i++}>
								<div className="key">{value}</div>
								<div className="value">{credential[value]}</div>
							</div>
						);
					}
				}
			)
			setDisplayedVc(obj);
		}
		else {
			console.log(credential)
			setDisplayedVc(credential);
		}


	}, [credential])

	return (
		<React.Fragment>
			{/* <h1 className='object-title'>
				{name !== "" ? name : "Credential"}
			</h1> */}
			<div id="VC">
				{displayedVc}
			</div>
		</React.Fragment>
	)
}

export default VC;