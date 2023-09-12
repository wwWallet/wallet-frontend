import { useEffect } from "react";


export default function useHandleServerMessages(): {} {

	let socket: WebSocket;

	useEffect(() => {
		socket = new WebSocket(`ws://wallet-backend-server:8002`);

		socket.addEventListener('open', (event) => {
			console.log('WebSocket connection opened');
			socket.send("First message")
		});

		socket.addEventListener('message', (event) => {
			console.log("Message reeceived = ", event.data)
		})

	}, []);

	return {};
}

