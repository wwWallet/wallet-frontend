import React, { useEffect, useRef, useState } from "react";
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

		const [handshakeEstablished, setHandshakeEstablished] = useState(false);
		const socketRef = useRef(null);
		const keystore = useLocalStorageKeystore();
		const signingRequestHandlerService = SigningRequestHandlerService();

		useEffect(
			() => {
				if (appToken) {
					if (!socketRef.current) {
						const socket = new WebSocket(REACT_APP_WS_URL);
						socketRef.current = socket;

						const sendInit = () => {
							console.log('WebSocket connection opened');
							if (!appToken) {
								return;
							}
							console.log("Sending...");
							// send handshake request
							socket.send(JSON.stringify({ type: "INIT", appToken: appToken }));
							socket.removeEventListener('open', sendInit);
						};

						const awaitHandshake = (event) => {
							try {
								const message = JSON.parse(event.data.toString());
								if (message?.type === "FIN_INIT") {
									console.log("init fin");
									setHandshakeEstablished(true);
									socket.removeEventListener('message', awaitHandshake);
									socket.addEventListener('message', handleMessage);
								}
							} catch (e) {
								console.error("Failed to handle message during WebSocket startup", e);
							}
						};

						const handleMessage = (event) => {
							try {
								const { message_id, request } = JSON.parse(event.data.toString());
								if (request.action == SignatureAction.createIdToken) {
									signingRequestHandlerService.handleCreateIdToken(socket, keystore, { message_id, ...request });

								} else if (request.action == SignatureAction.signJwtPresentation) {
									signingRequestHandlerService.handleSignJwtPresentation(socket, keystore, { message_id, ...request });

								} else if (request.action == SignatureAction.generateOpenid4vciProof) {
									signingRequestHandlerService.handleGenerateOpenid4vciProofSigningRequest(socket, keystore, { message_id, ...request });
								}
							} catch (e) {
								console.error("Failed to handle message", e);
							}
						};

						socket.addEventListener('open', sendInit);
						socket.addEventListener('message', awaitHandshake);
					}

				} else if (socketRef.current) {
					console.log('WebSocket close');
					socketRef.current.close();
					socketRef.current = null;
					setHandshakeEstablished(false);
				}
			},
			[appToken],
		);

		if (handshakeEstablished === true || !appToken) {
			return (<Component {...props} />);
		}
		else {
			return (<Spinner />); // loading component
		}

	};
}
