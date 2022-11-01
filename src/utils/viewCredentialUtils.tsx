import axios from "axios";

/**
 * Get JSON Schemas that the object references (including nested schemas)
 * @param obj Object
 * @returns An array of JSON Schemas that the object includes
 */
export const getSchemasFromObject = async (obj: any): Promise<any[]> => {

	const schemas: any[] = [];

	const innerSchemaUrl: string = obj.credentialSchema.id;
	var res = await axios.get(innerSchemaUrl);
	var innerSchema: any = res.data;
	schemas.push(innerSchema);

	const outerSchemaUrl: string = innerSchema.allOf[0]["$ref"];
	res = await axios.get(outerSchemaUrl);
	var outerSchema: any = res.data;
	schemas.push(outerSchema);

	return schemas;
}

/**
 * Get a Subschema, recursively, given a JSON Schema and a path
 * @param initialSchema An constant, initial JSON Schema 
 * @param schema The current JSON Schema
 * @param path The given path
 * @returns subschema
 */
export function getSchemaFromPath(initialSchema: any, schema: any, path: string) {
	if(!path) return schema;
	var segments = path.split(/[\/\.]/);
	// Account for leading `/` or `.`
	if(!segments[0]) segments = segments.slice(1);
	return getSchema(initialSchema, schema, segments);
}

function getSchema(initialSchema: any, schema: any, segments: string[]): any {
	if(!schema) return null;
	if(!segments.length || (segments.length === 1 && !segments[0])) return schema;
	// if ((schema.items && schema.items["$ref"])){
	// // nested ref edge case
	// 	return getSchemaDefinition(initialSchema, schema, schema.items["$ref"]);}
	var nextSegment = segments[0];
	var subSegments = segments.slice(1);
	var subSchema = null;
	if(schema.properties) {
		return getSchema(initialSchema, schema.properties[nextSegment], subSegments);
	} else if (schema.patternProperties) {
		var patterns = schema.patternProperties;
		for(var pattern in patterns) {
			if((new RegExp(pattern)).test(nextSegment)) {
				return getSchema(initialSchema, patterns[pattern], subSegments);
			}
		}
	} else if (schema.additionalProperties) {
		return getSchema(initialSchema, schema.additionalProperties, subSegments);
	} else if (schema.items) {
		return getSchema(initialSchema, schema.items, subSegments);
	} else if (schema.oneOf) {
		// Find oneOf element that has a matching property for next segment:
		var oneOfTarget = schema.oneOf.filter((item: any) => {
			return item.properties && item.properties[nextSegment]
		})[0];
		return getSchema(initialSchema, oneOfTarget && oneOfTarget.properties[nextSegment], subSegments);
	} else if (schema.allOf) {
		// Find allOf element that has a matching property for next segment:
		return getSchema(initialSchema, schema.allOf[1] && schema.allOf[1].properties[nextSegment], subSegments);
	} else if (schema.anyOf) {
		// Find an internal definition
		return getSchemaDefinition(initialSchema, schema, schema.anyOf[0]["$ref"], nextSegment, subSegments);
	} else {
		// There's no deeper schema defined
		return null;
	}
	return getSchema(initialSchema, subSchema, subSegments);
}

/**
 * Get a schema from an internal definition. Can continue recursively searching the schema.
 * @param initialSchema 
 * @param schema 
 * @param definition 
 * @param nextSegment 
 * @param subSegments 
 * @returns subschema
 */
export function getSchemaDefinition(initialSchema: any, schema: any, definition: string, nextSegment?: string, subSegments?: string[]): any {
	if(!schema) return null;
	if(!definition && schema.definitions) return schema.definitions;
	var referrence = definition.split('/').pop();
	if(!referrence) return null;
	if(initialSchema.definitions) {
		if(initialSchema.definitions[referrence]) {
			if(nextSegment === undefined || subSegments === undefined)
				return initialSchema.definitions[referrence];
			else
				return getSchema(initialSchema, initialSchema.definitions[referrence], [nextSegment].concat(subSegments));
		}
	} else {
		return null;
	}
}