import React, { useEffect, useRef, useState, useContext } from "react";
import { SignatureAction } from "../types/shared.types";
import { useLocalStorageKeystore } from "../services/LocalStorageKeystore";
import Spinner from '../components/Spinner';
import { SigningRequestHandlerService } from '../services/SigningRequestHandlers';
import { useApi } from "../api";
import OnlineStatusContext from '../context/OnlineStatusContext';

const REACT_APP_WS_URL = process.env.REACT_APP_WS_URL;

export default function handleServerMessagesGuard(Component) {

	return (props) => {
		const api = useApi();
		const appToken = api.getAppToken();

		const [handshakeEstablished, setHandshakeEstablished] = useState(false);
		const socketRef = useRef(null);
		const keystore = useLocalStorageKeystore();
		const signingRequestHandlerService = SigningRequestHandlerService();
		const { isOnline } = useContext(OnlineStatusContext);

		useEffect(() => {
			if (appToken) {
				if (!socketRef.current) {
					console.log('Attempting to establish WebSocket connection...');
					const socket = new WebSocket(REACT_APP_WS_URL);
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
				console.log('WebSocket closing due to offline or no appToken');
				socketRef.current.close();
				socketRef.current = null;
				setHandshakeEstablished(false);
			}

		}, [appToken, isOnline, api, keystore, signingRequestHandlerService]);

		if (isOnline !== null || handshakeEstablished || !appToken) {
			console.log('Rendering component');
			return (<Component {...props} />);
		} else {
			console.log('Rendering spinner');
			return (<Spinner />); // loading component
		}
	};
}
