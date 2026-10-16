import React from 'react';
import { Trans } from 'react-i18next';
import type { OpenidCredentialIssuerMetadata } from 'wallet-common';
import type { FilterItemByLang } from '@/hooks/useFilterItemByLang';

export function buildCredentialRedirectPopupContent({
	t,
	credentialConfigurationId,
	issuerMetadata,
	filterItemByLang,
}: {
	t: (key: string) => string;
	credentialConfigurationId: string;
	issuerMetadata: OpenidCredentialIssuerMetadata;
	filterItemByLang: FilterItemByLang;
}): { title: string; message: React.ReactNode } {

	const issuerDisplay = filterItemByLang(issuerMetadata?.display);
	const selectedCredentialConfiguration = credentialConfigurationId
		? issuerMetadata?.credential_configurations_supported?.[credentialConfigurationId]
		: null;
	const credentialDisplay = filterItemByLang(selectedCredentialConfiguration?.credential_metadata?.display);

	const resolvedCredentialName = credentialDisplay?.name ?? credentialConfigurationId ?? 'Unknown';
	const resolvedIssuerName = issuerDisplay?.name ?? (issuerMetadata?.credential_issuer ? new URL(issuerMetadata.credential_issuer).host : 'Unknown');
	const resolvedCredentialDescription = credentialDisplay?.description ?? '';

	return {
		title: `${resolvedCredentialName} (${resolvedIssuerName})`,
		message: (
			<Trans
				i18nKey="redirectPopup.issuanceMessage"
				values={{
					issuerName: resolvedIssuerName,
					issuerDescription: '',
					credentialName: resolvedCredentialName,
					credentialDescription: resolvedCredentialDescription ? `(${resolvedCredentialDescription})` : '',
				}}
				components={{ strong: <strong />, italic: <i /> }}
			/>
		),
	};
}
