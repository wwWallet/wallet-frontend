export type Verifier = {
	id: number;
	name: string;
	url: string;
	scopes: {
		name: string;
		description: string;
	}[];
}