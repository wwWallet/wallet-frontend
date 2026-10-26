import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import i18n from 'i18next';
import ProximitySharingPopup, { PROXIMITY_SHARING_STATUS } from './ProximitySharingPopup';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';

afterEach(() => {
	i18n.changeLanguage('en');
});

describe('ProximitySharingPopup Component', () => {
	it('uses the configured fallback language when it is not the first display entry', () => {
		const credential = {
			parsedCredential: {
				signedClaims: { given_name: 'John' },
				metadata: {
					credential: {
						TypeMetadata: {
							claims: [
								{
									path: ['given_name'],
									display: [
										{ locale: 'el', label: 'Όνομα' },
										{ locale: 'en', label: 'Given Name' },
									],
								},
							],
						},
					},
				},
			},
		} as unknown as ExtendedVcEntity;

		i18n.changeLanguage('pt');

		render(
			<ProximitySharingPopup
				isOpen={true}
				fullScreen={false}
				status={PROXIMITY_SHARING_STATUS.REVIEW}
				qrContent=""
				credential={credential}
				requestedFields={['given_name']}
				bluetoothPairingCancelled={false}
				requiresUserGesture={false}
				onConnect={() => {}}
				onConsent={() => {}}
				onCancel={() => {}}
				onClose={() => {}}
			/>,
		);
		expect(screen.getByText('Given Name')).toBeInTheDocument();
	});
});
