import { useCallback, useContext, useMemo } from "react";
import type { JWK } from "jose";
import SessionContext from "@/context/SessionContext";

export function usewalletProvider() {
	const { api: { post } } = useContext(SessionContext);

	const requestWalletInstanceAttestation = useCallback(async (
		publicJwk: JWK,
		clientId: string,
		authorizationServer: string,
	) => {
		try {
			const response = await post("/wallet-provider/wallet-instance-attestation/generate", {
				jwks: [publicJwk],
				openid4vci: {
					client_id: clientId,
					authorization_server: authorizationServer,
				},
			});
			const { wallet_instance_attestation } = response.data;
			if (!wallet_instance_attestation || typeof wallet_instance_attestation !== "string" || wallet_instance_attestation.length === 0) {
				console.log("Cannot parse key_attestation from wallet-backend-server");
				return null;
			}
			return { wallet_instance_attestation };
		}
		catch (err) {
			console.error("Failed to request Wallet Instance Attestation", err);
			return null;
		}
	}, [post]);

	return useMemo(() => ({ requestWalletInstanceAttestation }), [requestWalletInstanceAttestation]);
}
