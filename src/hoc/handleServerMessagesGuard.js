import React, { useEffect, useRef, useState, useContext } from "react";

import * as config from '../config';
import { SignatureAction } from "../types/shared.types";
import Spinner from '../components/Spinner';
import { SigningRequestHandlerService } from '../services/SigningRequestHandlers';
import StatusContext from '../context/StatusContext';
import SessionContext from "../context/SessionContext";


export default function handleServerMessagesGuard(Component) {

	return (props) => {

		const [handshakeEstablished, setHandshakeEstablished] = useState(false);
		const socketRef = useRef(null);
		const signingRequestHandlerService = SigningRequestHandlerService();
		const { isOnline } = useContext(StatusContext);
		const { api, keystore } = useContext(SessionContext);
		const appToken = api.getAppToken();

		useEffect(() => {
			if (appToken) {
				if (!socketRef.current) {
					console.log('Attempting to establish WebSocket connection...');
					const socket = new WebSocket(config.WS_URL);
					socketRef.current = socket;

					const sendInit = () => {
						console.log('WebSocket connection opened');
						if (!appToken) {
							console.log('No appToken available, cannot send handshake');
							return;
						}
						console.log("Sending handshake request...");
						socket.send(JSON.stringify({ type: "INIT", appToken: appToken }));
						socket.removeEventListener('open', sendInit);
					};

					const awaitHandshake = (event) => {
						try {
							const message = JSON.parse(event.data.toString());
							if (message?.type === "FIN_INIT") {
								console.log("Handshake successful");
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
							if (request.action === SignatureAction.signJwtPresentation) {
								signingRequestHandlerService.handleSignJwtPresentation(socket, keystore, { message_id, ...request });
							} else if (request.action === SignatureAction.generateOpenid4vciProof) {
								signingRequestHandlerService.handleGenerateOpenid4vciProofSigningRequest(api, socket, keystore, { message_id, ...request });
							} else {
								throw new Error("Unknown action: " + request.action, { cause: { unknown_action: request } });
							}
						} catch (e) {
							console.error("Failed to handle message", e);
						}
					};

					socket.addEventListener('open', sendInit);
					socket.addEventListener('message', awaitHandshake);
				}

			} else if (socketRef.current) {
				console.log('WebSocket closing due to offline or no appToken');
				socketRef.current.close();
				socketRef.current = null;
				setHandshakeEstablished(false);
			}

		}, [appToken, isOnline, api, keystore, signingRequestHandlerService]);

		if (isOnline === false || handshakeEstablished === true || !appToken) {
			console.log('Rendering component');
			return (<Component {...props} />);
		} else {
			console.log('Rendering spinner');
			return (<Spinner />); // loading component
		}
	};
}
