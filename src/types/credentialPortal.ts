import type { ReactNode } from 'react';

export interface PortalDisplay {
	name: string;
	description?: string;
	locale?: string;
	logo?: {
		uri: string;
		alt_text?: string;
	};
	background_color?: string;
	text_color?: string;
}

export interface CredentialPortalSource {
	id: number;
	url: string;
	display?: PortalDisplay[];
	visible: boolean;
}

export interface CredentialPortal extends CredentialPortalSource {
	identifierField: string;
	credentialConfigurationDisplayName: string;
	displayNode: (searchQuery: string) => ReactNode;
}
