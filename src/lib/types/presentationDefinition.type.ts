export type InputDescriporFormatType = {
	[formatType: string]: {
		alg: string[]
	}
};

export type InputDescriptorConstraintFieldType = {
	purpose: string;
	name: string;
	intent_to_retain?: boolean;
	path: string[];
	filter?: any; // JSON schema as an object.
}

export type InputDescriptorType = {
	id: string;
	format?: string;
	constraints: {
		fields: InputDescriptorConstraintFieldType[];
	}
}

export type PresentationDefinitionType = {
	id: string;
	input_descriptors: InputDescriptorType[]
}

export type PresentationSubmission = {
	id: string;
	definition_id: string;
	descriptor_map: DescriptorMapElement[]
}

export type DescriptorMapElement = {
	id: string;
	format: string;
	path: string;
	path_nested?: {
		format: string;
		path: string;
	}
}
