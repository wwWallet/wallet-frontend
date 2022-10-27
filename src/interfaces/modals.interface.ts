import Polyglot from "node-polyglot";
import { CredentialEntity } from "./credential.interface";
import { SelectElement } from "./SelectProps";

export interface CredentialModalProps {
	credential: CredentialEntity;
	polyglot: Polyglot;
	isOpen: boolean;
	closeModal(): void;
}

export interface ErrorModalProps {
	isOpen: boolean;
	handleClose(): void;
	polyglot: Polyglot;
	err: string;
}

export interface FilterCredentialModalProps {
	isOpen: boolean;
	handleClose(): void;
	handleSelect(types: SelectElement[]): void;
	credentialTypes: SelectElement[];
	selectedCredentialTypes: SelectElement[];
	polyglot: Polyglot
}