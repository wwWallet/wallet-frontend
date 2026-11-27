import { useCallback, useMemo } from 'react';
import type { JWK } from 'jose';
import { useSessionContext } from '@/context/SessionContext';
import { getOpenID4VCIProfile } from './OpenID4VCI/profiles';

export function useWalletProvider() {
	const {
		api: { post },
	} = useSessionContext();

	const requestWalletAttestation = useCallback(
		async (publicJwk: JWK, clientId: string, authorizationServer: string) => {
			try {
				const lifecycle = getOpenID4VCIProfile().attestationLifecycle;
				const response = await post('/wallet-provider/wallet-attestation/generate', {
					jwks: [publicJwk],
					openid4vci: {
						client_id: clientId,
						authorization_server: authorizationServer,
					},
				});
				const { wallet_attestation } = response.data;
				if (!wallet_attestation || typeof wallet_attestation !== 'string' || wallet_attestation.length === 0) {
					console.log('Cannot parse wallet_attestation from wallet-backend-server');
					return null;
				}
				lifecycle?.checkWalletAttestation(wallet_attestation);
				return { wallet_attestation };
			} catch (err) {
				console.error('Failed to request Wallet Attestation', err);
				return null;
			}
		},
		[post],
	);

	return useMemo(() => ({ requestWalletAttestation }), [requestWalletAttestation]);
}
