import React, { useEffect, useState } from 'react'
import { getSchemaDefinition, getSchemaFromPath } from '../../utils/viewCredentialUtils';
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

const specificationRequiredFields: string[] = ['title', 'eCTSCreditPoints','educationLevel','volumeOfLearning'];
const gradeRequiredFields: string[] = ['wasDerivedFrom', 'grade']
const requiredFields: string[] = specificationRequiredFields.concat(gradeRequiredFields);
const VC: React.FC<{ credential: any, handleSetPath(value: string, name?: string): void, name?: string, schemas: any[], path: string }> = ({ credential, name, handleSetPath, schemas, path }) => {

	var i = 0;
	const [displayedVc, setDisplayedVc] = useState<any>(undefined);


	useEffect(() => {

		var customSchemas: any[] = [];
		for (const schema of schemas) {
			const customSchema = getSchemaFromPath(schema, schema, path);
			if (customSchema!==null)
				customSchemas.push(customSchema);
		}

		if (typeof credential == 'object') {
			const obj: any = Object.keys(credential).map(
				(value) => {
					var showFlag: boolean = false;
					var dateFlag: boolean = false;
					if(requiredFields.includes(value))
						showFlag = true;
					var name: string = value;

					for (const schema of customSchemas) {
						var object = getSchemaFromPath(schemas[0], schema, value);
						if(object!==null) {

							if (object.anyOf!==undefined) {
								object = getSchemaDefinition(schemas[0], schemas[0], object.anyOf[0]["$ref"]);
							}

							if (object.title!==undefined) {
								showFlag = true;
								name = object.title;
								if(object.format && object.format === 'date-time')
									dateFlag = true;
								break;
							}

							if (!isNaN(+value) && credential[+value].title !== undefined) { // handle arrays
								showFlag = true;
								name = credential[+value].title;
								break;
							}
						}
					}

					if (typeof credential[value] == 'object') {

						if (Array.isArray(credential[value])) {
							const len: number = credential[value].length
							var isObj = false;
							if(len > 0 && typeof(credential[value][0]) == 'object')
								isObj = true;
							if(showFlag === true)
								return (
									<div className="card obj-card" key={i++} onClick={isObj ? () => handleSetPath(value, name) : () => {}}>
										<div className="key">{name}</div>
										<div className="value">
											{isObj
											?
											`Array with ${len} object${len !== 1 ? 's' : ''}`
											:
											`${credential[value].toString()}`
											}
										</div>
									</div>
								);
						}

						else {
							if (Array.isArray(credential)) {
								if(!isNaN(+value) && credential[+value].title !== undefined)
									name = credential[+value].title;
							}

							const len: number = Object.keys(credential[value]).length;
							if(showFlag === true)
								return (
									<div className="card obj-card" key={i++} onClick={() => handleSetPath(value, name)}>
										<div className="key">{name}</div>
										<div className="value">{`Object with ${len} attribute${len !== 1 ? 's' : ''}`}</div>
									</div>
								);
						}
					}
					else {
						if(showFlag === true)
							return (
								<div className="card val-card" key={i++}>
									<div className="key">{name}</div>
									<div className="value">
									{
										dateFlag ?
										new Date(credential[value]).toDateString() :
										credential[value]
									}
									</div>
								</div>
							);
					}
					return (<div key={i++}></div>);
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
			<div id="VC">
				{displayedVc}
			</div>
		</React.Fragment>
	)
}

export default VC;