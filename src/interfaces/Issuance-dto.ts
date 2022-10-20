export interface TokenRequestSuccessResult {
	success: true,
	tokenResponse: TokenResponseDTO
}

export interface TokenRequestErrorResult {
	success: false,
	errorCode: number
}

export interface TokenResponseDTO {
	access_token: string;
	id_token: string;
	token_type: string; //value must be bearer
	expires_in: number; //lifetime in seconds of the token
	c_nonce: string;
}

export interface CredentialRequestSuccessResult {
	success: true,
}

export interface CredentialRequestErrorResult {
	success: false,
	errorCode: number,
	errorText?: string
}

export interface CredentialResponseDTO {
	credential: string;
	c_nonce: string;
	c_nonce_expires_in: number;
}