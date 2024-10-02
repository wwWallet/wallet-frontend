import { DescriptorMapElement, InputDescriptorConstraintFieldType, InputDescriptorType, PresentationSubmission } from "../types/presentationDefinition.type";
import Ajv from "ajv";
import { base64url } from "jose";
import { JSONPath } from "jsonpath-plus";


export class Verify {
	/**
	 * Verifies presentation with presentation definition object
	 * @param vp_token
	 * @throws
	 */
	public static async getMatchesForPresentationDefinition(vp_token: string, presentationDefinitionObj: any): Promise<{ conformingCredentials: string[], presentationSubmission: PresentationSubmission }> {
		const vp_payload: any = JSON.parse(
			new TextDecoder().decode(base64url.decode(vp_token.split(".")[1]))
		);

		const vcJwtList: string[] = vp_payload.vp.verifiableCredential as string[];
		// check if it conforms with the presentation definition
		const descriptors: InputDescriptorType[] = JSONPath({
			path: "$.input_descriptors[*]",
			json: presentationDefinitionObj,
		}) as InputDescriptorType[];

		console.log("Descriptors = ", descriptors)
		const result = Verify.verifyRequirements(descriptors, vcJwtList);
		if (!result) {
			throw new Error("Failed to generate presentation submission");
		}
		const { conformingCredentials, descriptorMapElements } = result
		if (!descriptorMapElements || descriptorMapElements.length == 0) {
			throw new Error("Failed to generate presentation submission");
		}
		const presentationSubmission: PresentationSubmission = {
			id: "Example submission",
			definition_id: presentationDefinitionObj.id as string,
			descriptor_map: descriptorMapElements
		}
		return { conformingCredentials, presentationSubmission };
	}

	// For each input descriptor, if there is no VC found such that it satisfies at least one
	// input descriptor, then the validation fails
	public static verifyRequirements(descriptorsList: InputDescriptorType[], vcJwtList: string[], strict: boolean = false): { conformingCredentials: string[], descriptorMapElements: DescriptorMapElement[] } | null {

		const descriptorMapElements: DescriptorMapElement[] = [];
		const conformingCredentials: string[] = [];
		for (const inputDescriptor of descriptorsList) { // for each input descriptor
			let counter = 0;
			let index = 0;
			for (const vcJwt of vcJwtList) { // for each credential

				const res = Verify.verifyVcJwtWithDescriptor(inputDescriptor, vcJwt);
				if (!res) {
					index++;
					continue;
				}
				const descriptorMapElem: DescriptorMapElement = {
					id: inputDescriptor.id,
					format: vcJwt.includes('~') ? "vc+sd-jwt" : "jwt_vc",
					path: `$.verifiableCredential[${index++}]`,
					// path_nested: {
					// 	format: "jwt_vc",
					// 	path: `$.verifiableCredential[${index++}]`
					// }
				};

				if (descriptorMapElem) {
					descriptorMapElements.push(descriptorMapElem);
					conformingCredentials.push(vcJwt);
					counter++;
				}

			}
			// if the current descriptor is not satisfied by any VC, then result is failure
			if (counter == 0 && strict) {
				const conformingCredentials: string[] = [];
				const descriptorMapElements: any[] = [];
				return { conformingCredentials, descriptorMapElements };
			}
		}

		return { conformingCredentials, descriptorMapElements };
	}

	public static verifyVcJwtWithDescriptor(descriptor: InputDescriptorType, payload: any): boolean {

		const fieldsList: InputDescriptorConstraintFieldType[] = JSONPath({
			path: `$.constraints.fields[*]`,
			json: descriptor,
		}) as InputDescriptorConstraintFieldType[];


		const vcJSON = payload;
		for (const field of fieldsList) {
			const paths = field.path;
			const filter = field.filter; // is a json schema
			for (const p of paths) {
				const fieldVer = this.verifyField(vcJSON, filter, p)
				if (!fieldVer) {
					console.log(`Field verification failed for the field ${field?.name}`)
					return false;
				}
			}
		}
		return true;
	}

	private static verifyField(vcJSON: any, filter: any | undefined, path: string): boolean {
		const ajv = new Ajv();
		// each vc of path p must conform with filter
		// 1. get VC(p) value
		// 2. validate VC(p) value with the filter schema

		// get the first value, because jsonpath-plus returns
		// an array of the query results
		// console.log("Path = ", path)
		// console.log("Json = ", vcJSON)
		const vcValueByPath = JSONPath({ path: path, json: vcJSON })[0];
		if (!filter) { // if filter is undefined
			return true;
		}
		const validate = ajv.compile(filter);
		const validityStatus = validate(vcValueByPath);


		// console.log("Vc value by (path, status) = ", vcValueByPath, validityStatus);
		return validityStatus as boolean;
	}
}
