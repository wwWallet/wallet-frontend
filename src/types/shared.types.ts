export enum SignatureAction {
	generateOpenid4vciProof = "generateOpenid4vciProof",
	signJwtPresentation = "signJwtPresentation"
}

export type WalletKeystoreRequest = (
	{ action: SignatureAction.generateOpenid4vciProof, nonce: string, audience: string }
	| { action: SignatureAction.signJwtPresentation, nonce: string, audience: string, verifiableCredentials: any[] }
);


export type ServerSocketMessage = {
	message_id: string;
	request: WalletKeystoreRequest;
}



export type WalletKeystoreResponse = (
	{ action: SignatureAction.generateOpenid4vciProof, proof_jwt: string }
	| { action: SignatureAction.signJwtPresentation, vpjwt: string }
);

export type ClientSocketMessage = {
	message_id: string;
	response: WalletKeystoreResponse;
}
