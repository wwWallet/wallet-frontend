import React, { useCallback, useEffect, useRef, useState } from "react";
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
		const keystore = useLocalStorageKeystore();
		const signingRequestHandlerService = SigningRequestHandlerService();
		const socketRef = useRef();

		const onMessage = useCallback(
			async (event) => {
				try {
					const message = JSON.parse(event.data.toString());
					const { message_id, request } = message;

					if (request.action === SignatureAction.createIdToken) {
						signingRequestHandlerService.handleCreateIdToken(socketRef.current, keystore, { message_id, ...request });

					} else if (request.action === SignatureAction.signJwtPresentation) {
						signingRequestHandlerService.handleSignJwtPresentation(socketRef.current, keystore, { message_id, ...request });

					} else if (request.action === SignatureAction.generateOpenid4vciProof) {
						signingRequestHandlerService.handleGenerateOpenid4vciProofSigningRequest(socketRef.current, keystore, { message_id, ...request });
					}
				} catch (e) {
					console.log('failed to parse message');
				}
			},
			[keystore, signingRequestHandlerService],
		);

		useEffect(
			() => {
				if (!appToken) {
					return () => {};
				}

				if (!socketRef.current) {
					const socket = new WebSocket(REACT_APP_WS_URL);
					socketRef.current = socket;

					socket.addEventListener('open', (event) => {
						console.log('WebSocket connection opened');
						console.log("Sending...");
						// send handshake request
						socket.send(JSON.stringify({ type: "INIT", appToken: appToken }));
					});

					const onInit = (event) => {
						try {
							const message = JSON.parse(event.data.toString());
							const { type } = message;

							if (type === "FIN_INIT") {
								console.log("init fin");
								setHandshakeEstablished(true);
								socket.removeEventListener('message', onInit);
							}
						} catch (e) {
							console.log('failed to parse message');
						}
					};
					socket.addEventListener('message', onInit);
				}

				if (handshakeEstablished) {
					socketRef.current.addEventListener('message', onMessage);
					return () => {
						socketRef.current.removeEventListener('message', onMessage);
					};
				}

				return () => {};
			},
			[appToken, handshakeEstablished, onMessage],
		);

		console.log('->',handshakeEstablished,appToken);
		if (handshakeEstablished === true || !appToken) {
			return (<Component {...props} />);
		}
		else {

			return (<Spinner />); // loading component
		}
	};
}
