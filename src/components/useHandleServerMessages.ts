import { useEffect } from "react";
import { useLocalStorageKeystore } from "../services/LocalStorageKeystore";
import { ClientSocketMessage, SignatureAction, WalletKeystoreRequest } from "../types/shared.types";


export default function useHandleServerMessages(): {} {

	const keystore = useLocalStorageKeystore();
	let socket: WebSocket;

	useEffect(() => {
		socket = new WebSocket(`ws://wallet-backend-server:8002`);

		socket.addEventListener('open', (event) => {
			console.log('WebSocket connection opened');
			socket.send("First message")
		});

		socket.addEventListener('message', async (event) => {
			try {
				const message = JSON.parse(event.data);
				const { message_id, request } = message as { message_id: string, request: WalletKeystoreRequest };
				if (request.action == SignatureAction.generateOpenid4vciProof) {
					const { proof_jwt } = await keystore.generateOpenid4vciProof(request.audience, request.nonce)
					console.log("proof jwt = ", proof_jwt);
					const outgoingMessage: ClientSocketMessage = {
						message_id: message_id,
						response: {
							action: request.action,
							proof_jwt: proof_jwt
						}
					}
					socket.send(JSON.stringify(outgoingMessage));
				}
				console.log("Message reeceived = ", event.data)
			}
			catch(e) {
				console.log('failed to parse message')
			}
		})

	}, []);

	return {};
}

