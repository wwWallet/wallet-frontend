import { BackendApi } from "../api";
import { ClientSocketMessage, SignatureAction } from "../types/shared.types";
import { LocalStorageKeystore } from "./LocalStorageKeystore";


interface SigningRequestHandlers {
	handleSignJwtPresentation(socket: WebSocket, keystore: LocalStorageKeystore, { message_id, audience, nonce, verifiableCredentials }: { message_id: string; audience: string; nonce: string; verifiableCredentials: any[]; }): Promise<void>;
	handleGenerateOpenid4vciProofSigningRequest(api: BackendApi, socket: WebSocket, keystore: LocalStorageKeystore, { message_id, audience, nonce, issuer }: { message_id: string; audience: string; nonce: string; issuer: string }): Promise<void>;
}


export function SigningRequestHandlerService(): SigningRequestHandlers {
	return {
		handleSignJwtPresentation: async (socket, keystore, { message_id, audience, nonce, verifiableCredentials }) => {
			const { vpjwt } = await keystore.signJwtPresentation(nonce, audience, verifiableCredentials)
			console.log("vp jwt = ", vpjwt);
			const outgoingMessage: ClientSocketMessage = {
				message_id: message_id,
				response: {
					action: SignatureAction.signJwtPresentation,
					vpjwt: vpjwt
				}
			}
			socket.send(JSON.stringify(outgoingMessage));
		},

		handleGenerateOpenid4vciProofSigningRequest: async (api: BackendApi, socket, keystore, { message_id, audience, nonce, issuer }) => {
			const [{ proof_jwts: [proof_jwt] }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs([{ nonce, audience, issuer }])
			await api.updatePrivateData(newPrivateData);
			await keystoreCommit();
			console.log("proof jwt = ", proof_jwt);
			const outgoingMessage: ClientSocketMessage = {
				message_id: message_id,
				response: {
					action: SignatureAction.generateOpenid4vciProof,
					proof_jwt: proof_jwt
				}
			}
			socket.send(JSON.stringify(outgoingMessage));
		},
	}
}
