import jwtDecode from "jwt-decode";
import { CredentialEntity, VerifiableCredential } from "../interfaces/credential.interface";
import { SelectElement } from "../interfaces/SelectProps";

export const extractAllCredentialTypes = (credentials: CredentialEntity[]): SelectElement[] => {

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

export const getCredentialTypes = (credential: CredentialEntity): string[] => {

	var decodedCredential: VerifiableCredential;
	try {
		decodedCredential = decodeVC(credential);
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

export const decodeVC = (credential: CredentialEntity): VerifiableCredential => {
	if (credential.type === "jwt_vc") {
		const decodedCredential = jwtDecode(credential.credential);
		if(isVerifiableCredential(decodedCredential))
			return decodedCredential as VerifiableCredential;
		else
			throw new Error("Decoded Credential is invalid");
	}
	
	else if (credential.type === "ldp_vc")
		throw new Error("Unsupported Type. ldp_vc credentials not supported yet");
	else
		throw new Error("Unknown credential type");
}

export const isVerifiableCredential = (credential: any): boolean => {

	try {
		if(!isVCPayload(credential.vc)) {
			console.log('invalid credential payload');
			return false;
		}

		if(credential.iss === undefined) {
			console.log('credential iss missing');
			return false;
		}

		if(credential.iat === undefined) {
			console.log('credential iat missing');
			return false;
		}

		if(credential.nbf === undefined) {
			console.log('credential nbf missing');
			return false;
		}

		if(credential.jti === undefined) {
			console.log('credential jti missing');
			return false;
		}

		return true;
	}
	catch {
		return false;
	}
}

export const isVCPayload = (credential: any): boolean => {

	try {
		if(credential.credentialSubject === undefined) {
			console.log('credentialSubject missing');
			return false;
		}

		return true;
	}
	catch {
		return false;
	}
}