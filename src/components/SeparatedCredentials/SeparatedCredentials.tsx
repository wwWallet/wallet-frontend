import React, { useEffect, useState } from "react";
import CredentialList, { Credentials, Credential } from "../CredentialList/CredentialList";
import './SeparatedCredentials.css';



// important constants, holding the VCs as seperated
// must not be variable
var constVidList: Credential[] = [];
var constVcList: Credential[] = [];

export const SeparatedCredentials: React.FC<Credentials> = ({ polyglot, credentials, present, loaded }) => {


	console.log('Credentials = ', credentials.length)
	// credentials.forEach(credential => {
	// 	if (credential.type.includes("VerifiableId")) {
	// 		tempVids.push(credential);
	// 	}
	// 	else {
	// 		tempVcs.push(credential);
	// 	}
	// 	console.log('temp vid = ', tempVids)
	// });
	// const [vidListSize, setVidListSize] = useState<number>(tempVids.length);

	// const [vcListSize, setVcListSize] = useState<number>(tempVcs.length);



	const [vidList, setVidList] = useState<Credential[]>([]);
	const [vcList, setVcList] = useState<Credential[]>([]);
	const [searchInput, setSearchInput] = useState<string>("");

	useEffect(() => {
		var tempVids: Credential[] = [];
		var tempVcs: Credential[] = [];
		for (let i = 0; i < credentials.length; i++) {
			if (credentials[i].type.includes("VerifiableId")) {
				tempVids.push(credentials[i]);
				constVidList.push(credentials[i])
			}
			else {
				tempVcs.push(credentials[i]);
				constVcList.push(credentials[i])
			}
		}
		console.log('temp vids = ', tempVids.length)
		console.log('trigger')
		setVidList(tempVids);
		setVcList(tempVcs);
		
	}, [credentials]);



	// searchFunc():
	// split input into a word list
	// use words as search terms
	// for each word, 
	// 	if word.lowerCase() exists in stringified(vc),
	// 		then include this vc in the vc list 
	const searchFunc = (e: any) => {
		const currentInput: string = e.target.value.toLowerCase(); // current search value
		const words: string[] = currentInput.split(' ');
		const newVcList: Credential[] = [];
		for (let i = 0; i < constVcList.length; i++) {
			const vc = constVcList[i];
			const stringifiedVC = JSON.stringify(vc).toLowerCase();
			for (let i = 0; i < words.length; i++) {
				if (stringifiedVC.includes(words[i]) && 
						newVcList.find(k => JSON.stringify(k) == stringifiedVC) == undefined)
					newVcList.push(vc);
			}
		}

		const newVidList: Credential[] = [];
		for (let i = 0; i < constVidList.length; i++) {
			const vc = constVidList[i];
			const stringifiedVC = JSON.stringify(vc).toLowerCase();
			for (let i = 0; i < words.length; i++) {
				if (stringifiedVC.includes(words[i]) && 
						newVidList.find(k => JSON.stringify(k) == stringifiedVC) == undefined)
					newVidList.push(vc);
			}
		}
		setVcList(newVcList);
		setVidList(newVidList);
		setSearchInput(currentInput);
	}

	return (
		<React.Fragment>
			<div className="search-container">
				<div className="search">
					<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet"/>

					<input type="text" onChange={searchFunc} className="searchTerm" placeholder="&#xF002;"/>
				</div>
			</div>
			<h4 >{polyglot.t('Wallet.tab1.verifiableIdentifiers')}</h4>
			<CredentialList polyglot={polyglot} credentials={vidList} present={present} loaded={loaded}/>
			{!vidList.length && loaded &&
				<div className="message">
					{polyglot.t('Wallet.tab1.emptyVID')}
				</div>
			 }
			<div className="mid-divider"/>
			<h4>{polyglot.t('Wallet.tab1.verifiableCredentials')}</h4>
			<CredentialList polyglot={polyglot} credentials={vcList} present={present} loaded={loaded}/>
			{!vcList.length && loaded &&
				<div className="message">
					{polyglot.t('Wallet.tab1.emptyVC')}
				</div>
			 }
		</React.Fragment>
	);
}


export default SeparatedCredentials;