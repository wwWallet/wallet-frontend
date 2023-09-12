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
				if (request.action == SignatureAction.generateOpenid4vciProof) {
					handleGenerateOpenid4vciProofSigningRequest({ message_id, ...request });
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

