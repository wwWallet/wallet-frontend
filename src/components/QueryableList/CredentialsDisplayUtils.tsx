import React from 'react';
import EntityListItem from './EntityListItem';

export function getCredentialType(parsedCredential: any): string {
	return (
		parsedCredential?.metadata?.credential?.vct ??
		parsedCredential?.metadata?.credential?.doctype ??
		''
	);
}

export function buildCredentialConfiguration(
	key: string,
	config: any,
	metadata: any,
	filterItemByLang: (items: any[], langKey: string) => any
): {
	identifierField: string;
	credentialConfigurationDisplayName: string;
	displayNode: (searchQuery: string) => React.ReactNode;
	credentialConfigurationName: string;
	credentialConfigurationId: string;
	credentialIssuerIdentifier: string;
	credentialConfiguration: any;
} {
	const display = filterItemByLang(config?.display, 'locale');
	const credentialDisplay = {
		...display,
		credentialConfigurationId: key,
	};

	const issuerDisplayLang = filterItemByLang(metadata.display, 'locale');
	const issuerDisplay = {
		name:
			issuerDisplayLang?.name ??
			new URL(metadata.credential_issuer).host,
		logo: issuerDisplayLang?.logo ?? null,
		background_color: issuerDisplayLang?.background_color,
		text_color: issuerDisplayLang?.text_color,
	};

	const credentialConfigurationDisplayName = `${credentialDisplay.name} (${issuerDisplay.name})`;

	return {
		identifierField: JSON.stringify([key, metadata.credential_issuer]),
		credentialConfigurationDisplayName,
		displayNode: (searchQuery: string): React.ReactNode => (
			<EntityListItem
				primaryData={credentialDisplay}
				secondaryData={issuerDisplay}
				searchQuery={searchQuery}
			/>
		),
		credentialConfigurationName: credentialDisplay.name ?? 'Unknown',
		credentialConfigurationId: key,
		credentialIssuerIdentifier: metadata.credential_issuer,
		credentialConfiguration: config,
	};
}
