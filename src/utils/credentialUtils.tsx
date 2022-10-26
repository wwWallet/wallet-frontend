import jwtDecode from "jwt-decode";
import { SelectElement } from "../interfaces/SelectProps";

export const extractAllCredentialTypes = (credentials: any[]): SelectElement[] => {

	// Get all User types as strings
	const userTypes: string[] = [];
	credentials.forEach( (credential) => {

		var types: string[];
		try {
			types = getCredentialTypes(credential);
		}
		catch (err) {
			throw new Error(err as string);
		}

		types.forEach( (type) => {
			if(!userTypes.includes(type))
				userTypes.push(type);
		});

	});

	// Convert found types to Select Elements
	const credentialTypes: SelectElement[] = [];
	userTypes.forEach( (type) => {
		credentialTypes.push({value: type, label: type});
	});

	return credentialTypes;
}

export const getCredentialTypes = (credential: any): string[] => {
	
	if(credential.jwt == undefined) {
		throw new Error('Credential has no JWT field');
	}

	var decodedCredential: any;
	try {
		decodedCredential = jwtDecode(credential.jwt);
	}
	catch (err) {
		throw new Error(`Failed to decode credential. Error: ${err}`);
	}

	try {
		return decodedCredential.vc.type;
	}
	catch (err) {
		throw new Error(`Failed to fetch credential types. Error: ${err}`);
	}
}

export const credentialHasSelectedTypes = (credential: any, types: SelectElement[]): boolean => {

	const credentialTypes: string[] = getCredentialTypes(credential);

	// deconstruct types
	const availableTypes: string[] = [];
	types.forEach( (type) => {
		availableTypes.push(type.label);
	})
	

	for (const type of credentialTypes) {
		if(availableTypes.includes(type))
			return true;
	}
	return false;
}