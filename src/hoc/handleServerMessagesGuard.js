import React, { useEffect, useState } from "react";
import { SignatureAction } from "../types/shared.types";
import { useLocalStorageKeystore } from "../services/LocalStorageKeystore";
import Spinner from '../components/Spinner';
import { SigningRequestHandlerService } from '../services/SigningRequestHandlers';
import { useApi } from "../api";

const REACT_APP_WS_URL = process.env.REACT_APP_WS_URL;

export default function handleServerMessagesGuard(Component) {
	return (props) => {
		const api = useApi();
		const appToken = api.getAppToken();

		const [ handshakeEstablished, setHandshakeEstablished ] = useState(false);
		const socket = new WebSocket(REACT_APP_WS_URL);
		const keystore = useLocalStorageKeystore();
		const signingRequestHandlerService = SigningRequestHandlerService();
		const [isSocketOpen, setIsSocketOpen] = useState(false);


		socket.addEventListener('open', (event) => {
			console.log('WebSocket connection opened');
			if (!appToken) {
				return;
			}
			console.log("Sending...");
			// send handshake request
			socket.send(JSON.stringify({ type: "INIT", appToken: appToken }));
			setIsSocketOpen(true); // Set the state to indicate that the connection is open
		});

		const waitForHandshake = async () => {
			return new Promise((resolve, reject) => {
				socket.onmessage = event => {
					try {
						console.log('--->',event.data.toString());
						const { type } = JSON.parse(event.data.toString());
						if (type === "FIN_INIT") {
							console.log("init fin");
							setHandshakeEstablished(true);

							resolve({});
						}
					}
					catch(e) {
						reject(e);
					}
				};
			});
		};

		useEffect(() => {
			if (isSocketOpen) {
				waitForHandshake();
				// You can perform other actions that depend on the socket being open here.
			}
		}, [isSocketOpen]);

		socket.addEventListener('message', async (event) => {
			try {
				const message = JSON.parse(event.data.toString());
				const { message_id, request } = message;
				if (request.action === SignatureAction.createIdToken) {
					signingRequestHandlerService.handleCreateIdToken(socket, keystore, { message_id, ...request });
				}
				else if (request.action === SignatureAction.signJwtPresentation) {
					signingRequestHandlerService.handleSignJwtPresentation(socket, keystore, { message_id, ...request });
				}
				else if (request.action === SignatureAction.generateOpenid4vciProof) {
					signingRequestHandlerService.handleGenerateOpenid4vciProofSigningRequest(socket, keystore, { message_id, ...request });
				}
			}
			catch(e) {
			}
		});

		console.log('->',handshakeEstablished,appToken);
		if (handshakeEstablished === true || !appToken) {
			return (<Component {...props} />);
		}
		else {

			return (<Spinner />); // loading component
		}
	};
}
