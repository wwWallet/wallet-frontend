export interface importRequestDTO {
    payload: string;
    password: string;
}

export interface importResponseDTO {
    success: boolean;
    did: string;
}

export interface exportRequestDTO {
    did: string;
    password: string;
}