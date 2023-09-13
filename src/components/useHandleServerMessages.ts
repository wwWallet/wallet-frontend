import { useEffect } from "react";
import { useLocalStorageKeystore } from "../services/LocalStorageKeystore";
import { ClientSocketMessage, SignatureAction, WalletKeystoreRequest } from "../types/shared.types";
import Cookies from 'js-cookie';

export default function useHandleServerMessages(): {} {


	const keystore = useLocalStorageKeystore();
	let socket: WebSocket;


	useEffect(() => {
		socket = new WebSocket(`ws://wallet-backend-server:8002`);

		socket.addEventListener('open', (event) => {
			console.log('WebSocket connection opened');
			const appToken = Cookies.get("appToken");
			console.log("App token = ", appToken)
			if (!appToken) {
				return;
			}
			// send handshake request
			socket.send(JSON.stringify({ appToken: appToken }))
		});

		const handleCreateIdToken = async ({ message_id, audience, nonce }: { message_id: string, audience: string, nonce: string}) => {
			const { id_token } = await keystore.createIdToken(audience, nonce)
			console.log("id token = ", id_token);
			const outgoingMessage: ClientSocketMessage = {
				message_id: message_id,
				response: {
					action: SignatureAction.createIdToken,
					id_token: id_token
				}
			}
			socket.send(JSON.stringify(outgoingMessage));
		}

		const handleSignJwtPresentation = async ({ message_id, audience, nonce, verifiableCredentials }: { message_id: string, audience: string, nonce: string, verifiableCredentials: any[]}) => {
			const { vpjwt } = await keystore.signJwtPresentation(audience, nonce, verifiableCredentials)
			console.log("vp jwt = ", vpjwt);
			const outgoingMessage: ClientSocketMessage = {
				message_id: message_id,
				response: {
					action: SignatureAction.signJwtPresentation,
					vpjwt: vpjwt
				}
			}
			socket.send(JSON.stringify(outgoingMessage));
		}

		const handleGenerateOpenid4vciProofSigningRequest = async ({ message_id, audience, nonce }: { message_id: string, audience: string, nonce: string}) => {
			const { proof_jwt } = await keystore.generateOpenid4vciProof(audience, nonce)
			console.log("proof jwt = ", proof_jwt);
			const outgoingMessage: ClientSocketMessage = {
				message_id: message_id,
				response: {
					action: SignatureAction.generateOpenid4vciProof,
					proof_jwt: proof_jwt
				}
			}
			socket.send(JSON.stringify(outgoingMessage));
		}

		socket.addEventListener('message', async (event) => {
			try {
				const message = JSON.parse(event.data);
				const { message_id, request } = message as { message_id: string, request: WalletKeystoreRequest };
				if (request.action == SignatureAction.createIdToken) {
					handleCreateIdToken({ message_id, ...request });
				}
				else if (request.action == SignatureAction.signJwtPresentation) {
					handleSignJwtPresentation({ message_id, ...request });
				}
				else if (request.action == SignatureAction.generateOpenid4vciProof) {
					handleGenerateOpenid4vciProofSigningRequest({ message_id, ...request });
				}
				console.log("Message received = ", event.data)
			}
			catch(e) {
				console.log('failed to parse message')
			}
		})

	}, []);

	return {};
}

