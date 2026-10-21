import React from 'react';
import EntityListItem from './EntityListItem';
import type { FilterItemByLang } from '@/hooks/useFilterItemByLang';
import type {
	CredentialPortal,
	CredentialPortalSource,
	PortalDisplay,
} from '@/types/credentialPortal';
import type {
	CredentialConfigurationSupported,
	OpenidCredentialIssuerMetadata,
	ParsedCredential,
} from 'wallet-common';

type CredentialConfigurationDisplay = NonNullable<
	NonNullable<CredentialConfigurationSupported['credential_metadata']>['display']
>[number];

type IssuerDisplay = NonNullable<OpenidCredentialIssuerMetadata['display']>[number];

export function getCredentialType(parsedCredential: ParsedCredential | null | undefined): string {
	const credential = parsedCredential?.metadata.credential;
	if (!credential) return '';
	return 'vct' in credential ? credential.vct : credential.doctype;
}

export function buildCredentialPortal(
	portal: CredentialPortalSource,
	filterItemByLang: FilterItemByLang,
): CredentialPortal | null {
	const display = filterItemByLang<PortalDisplay>(portal.display);
	let portalUrl: URL;
	try {
		portalUrl = new URL(portal.url);
	} catch {
		return null;
	}

	if (!display?.name || !['http:', 'https:'].includes(portalUrl.protocol)) {
		return null;
	}

	return {
		...portal,
		identifierField: `portal-${portal.id}`,
		credentialConfigurationDisplayName: [display.name, display.description]
			.filter(Boolean)
			.join(' '),
		displayNode: (searchQuery: string): React.ReactNode => (
			<EntityListItem primaryData={display} searchQuery={searchQuery} />
		),
	};
}

export function buildCredentialConfiguration(
	key: string,
	config: CredentialConfigurationSupported,
	metadata: OpenidCredentialIssuerMetadata,
	filterItemByLang: FilterItemByLang,
) {
	const display = filterItemByLang<CredentialConfigurationDisplay>(
		config?.credential_metadata?.display,
	);
	const credentialDisplay = {
		...display,
		name: display?.name ?? key,
		credentialConfigurationId: key,
	};

	const issuerDisplayLang = filterItemByLang<IssuerDisplay>(metadata.display);
	const issuerDisplay = {
		name: issuerDisplayLang?.name ?? new URL(metadata.credential_issuer).host,
		logo: issuerDisplayLang?.logo ?? null,
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
		credentialDisplay: credentialDisplay,
		credentialConfigurationId: key,
		credentialIssuerIdentifier: metadata.credential_issuer,
		credentialConfiguration: config,
	};
}
