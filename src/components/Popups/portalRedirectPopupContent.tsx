import React from 'react';
import { Trans } from 'react-i18next';
import type { FilterItemByLang } from '@/hooks/useFilterItemByLang';
import type { CredentialPortal } from '@/types/credentialPortal';

export function buildPortalRedirectPopupContent({
	portal,
	filterItemByLang,
}: {
	portal: CredentialPortal;
	filterItemByLang: FilterItemByLang;
}): { title: string; message: React.ReactNode } {
	const portalDisplay = filterItemByLang(portal.display);

	return {
		title: portalDisplay.name,
		message: (
			<Trans
				i18nKey="redirectPopup.portalMessage"
				values={{
					portalName: portalDisplay.name,
					portalDescription: portalDisplay.description ? `(${portalDisplay.description})` : '',
				}}
				components={{ strong: <strong />, italic: <i /> }}
			/>
		),
	};
}
