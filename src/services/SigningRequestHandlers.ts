import { BackendApi } from "../api";
import { ClientSocketMessage, SignatureAction } from "../types/shared.types";
import { LocalStorageKeystore } from "./LocalStorageKeystore";


interface SigningRequestHandlers {
	handleCreateIdToken(api: BackendApi, socket: WebSocket, keystore: LocalStorageKeystore, { message_id, audience, nonce }: { message_id: string; audience: string; nonce: string; }): Promise<void>;
	handleSignJwtPresentation(socket: WebSocket, keystore: LocalStorageKeystore, { message_id, audience, nonce, verifiableCredentials }: { message_id: string; audience: string; nonce: string; verifiableCredentials: any[]; }): Promise<void>;
	handleGenerateOpenid4vciProofSigningRequest(api: BackendApi, socket: WebSocket, keystore: LocalStorageKeystore, { message_id, audience, nonce }: { message_id: string; audience: string; nonce: string; }): Promise<void>;
}


export function SigningRequestHandlerService(): SigningRequestHandlers {
	return {
		handleCreateIdToken: async (api: BackendApi, socket: WebSocket, keystore: LocalStorageKeystore, { message_id, audience, nonce }: { message_id: string; audience: string; nonce: string; }) => {
			const [{ id_token }, newPrivateData, keystoreCommit] = await keystore.createIdToken(nonce, audience)
			await api.updatePrivateData(newPrivateData);
			await keystoreCommit();
			console.log("id token = ", id_token);
			const outgoingMessage: ClientSocketMessage = {
				message_id: message_id,
				response: {
					action: SignatureAction.createIdToken,
					id_token: id_token
				}
			}
			socket.send(JSON.stringify(outgoingMessage));
		},

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

		handleGenerateOpenid4vciProofSigningRequest: async (api: BackendApi, socket, keystore, { message_id, audience, nonce }) => {
			const [{ proof_jwt }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProof(nonce, audience)
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
