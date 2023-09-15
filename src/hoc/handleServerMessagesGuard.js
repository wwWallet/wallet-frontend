import React, { useEffect, useState } from "react";
import { SignatureAction } from "../types/shared.types";
import Cookies from "js-cookie";
import { useLocalStorageKeystore } from "../services/LocalStorageKeystore";
import Spinner from '../components/Spinner';
import { SigningRequestHandlerService } from '../services/SigningRequestHandlers';

export default function handleServerMessagesGuard(Component) {
	return (props) => {
		const appToken = Cookies.get("appToken");

		const [ handshakeEstablished, setHandshakeEstablished ] = useState(false);
		const socket = new WebSocket(`ws://wallet-backend-server:8002`);
		const keystore = new useLocalStorageKeystore();
		const signingRequestHandlerService = SigningRequestHandlerService();


		socket.addEventListener('open', (event) => {
			console.log('WebSocket connection opened');
			if (!appToken) {
				return;
			}
			console.log("Sending...")
			// send handshake request
			socket.send(JSON.stringify({ type: "INIT", appToken: appToken }))
		});

		const waitForHandshake = async () => {
			return new Promise((resolve, reject) => {
				socket.onmessage = event => {
					try {
						const { type } = JSON.parse(event.data.toString());
						if (type == "FIN_INIT") {
							console.log("init fin")
							setHandshakeEstablished(true);
							resolve({});
						}
					}
					catch(e) {
						reject(e);
					}
				}
			});
		}

		useEffect(() => {
			waitForHandshake();
		}, []);

		socket.addEventListener('message', async (event) => {
			try {
				const message = JSON.parse(event.data.toString());
				const { message_id, request } = message;
				if (request.action == SignatureAction.createIdToken) {
					signingRequestHandlerService.handleCreateIdToken(socket, keystore, { message_id, ...request });
				}
				else if (request.action == SignatureAction.signJwtPresentation) {
					signingRequestHandlerService.handleSignJwtPresentation(socket, keystore, { message_id, ...request });
				}
				else if (request.action == SignatureAction.generateOpenid4vciProof) {
					signingRequestHandlerService.handleGenerateOpenid4vciProofSigningRequest(socket, keystore, { message_id, ...request });
				}
			}
			catch(e) {
				console.log('failed to parse message')
			}
		})

		if (handshakeEstablished === true || !appToken) {
			return (<Component {...props} />);
		}
		else {
			return (<Spinner />); // loading component
		}
	}
}