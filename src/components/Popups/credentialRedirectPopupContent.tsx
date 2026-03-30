import React from 'react';
import { Trans } from 'react-i18next';

export function buildCredentialRedirectPopupContent({
	t,
	credentialConfigurationId,
	issuerMetadata,
	filterItemByLang,
}: {
	t: (key: string) => string;
	credentialConfigurationId?: string | null;
	issuerMetadata?: any;
	filterItemByLang: (items: any[], langKey: string) => any;
}): { title: string; message: React.ReactNode } {

	const issuerDisplay = filterItemByLang(issuerMetadata?.display, 'locale');
	const selectedCredentialConfiguration = credentialConfigurationId
		? issuerMetadata?.credential_configurations_supported?.[credentialConfigurationId]
		: null;
	const credentialDisplay = filterItemByLang(selectedCredentialConfiguration?.credential_metadata?.display, 'locale');

	const resolvedCredentialName = credentialDisplay?.name ?? credentialConfigurationId ?? 'Unknown';
	const resolvedIssuerName = issuerDisplay?.name ?? (issuerMetadata?.credential_issuer ? new URL(issuerMetadata.credential_issuer).host : 'Unknown');
	const resolvedIssuerDescription = issuerDisplay?.description ?? '';
	const resolvedCredentialDescription = credentialDisplay?.description ?? '';

	return {
		title: `${resolvedCredentialName} (${resolvedIssuerName})`,
		message: (
			<Trans
				i18nKey="pageAddCredentials.popup.message"
				values={{
					issuerName: resolvedIssuerName,
					issuerDescription: resolvedIssuerDescription ? `(${resolvedIssuerDescription})` : '',
					credentialName: resolvedCredentialName,
					credentialDescription: resolvedCredentialDescription ? `(${resolvedCredentialDescription})` : '',
				}}
				components={{ strong: <strong />, italic: <i /> }}
			/>
		),
	};
}
