import React from 'react';
import { Trans } from 'react-i18next';

export function buildPortalRedirectPopupContent({
	portal,
	filterItemByLang,
}: {
	portal: any;
	filterItemByLang: (items: any[], langKey: string) => any;
}): { title: string; message: React.ReactNode } {
	const portalDisplay = filterItemByLang(portal.display, 'locale');

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
