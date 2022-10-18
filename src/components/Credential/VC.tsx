
import React, { useEffect, useState } from 'react'
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
		let parsedData: JSX.Element = <>
			{object.map((value: any) => {
				return <> 
					{generateDataFromVC(value, depth+1)}
					<br />
				</>
			})}
		</>
		return parsedData;
	}


  console.log("Object = ", object)
	let parsedData: JSX.Element = <>
		{Object.keys(object).map((key: any) => {
			console.log('key = ', typeof key, ' , ', object[key], ' depth = ', depth)
			return <>
				{ ['string', 'number'].includes(typeof object[key]) ? <></> : styleAccordingToDepth(key, depth) }
				{ ['string', 'number'].includes(typeof object[key]) ? <div className='layout'><div>{key + ": "} </div><div>{object[key]}</div></div> : generateDataFromVC(object[key], Array.isArray(object[key]) ? depth : depth+1) }
				<br />
			</>
		})}
	</>;
	console.log("Out, ", parsedData)
  return parsedData
}

const VC = () => {

	const [renderedCredential, setRenderedCredential] = useState<JSX.Element>();

	return <>
		<div id="VC">

			{generateDataFromVC(credential, 0)}
		</div>
	</>
}

export default VC;