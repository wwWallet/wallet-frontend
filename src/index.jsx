import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ConsoleBehavior from './ConsoleBehavior';
import { StatusProvider } from './context/StatusProvider';
import { initializeDataSource } from './indexedDB';
import * as firebaseSW from './firebase';
import Modal from 'react-modal';
import './index.css';
import { BrowserRouter } from "react-router-dom";
import { SessionContextProvider } from './context/SessionProvider';
import { CredentialParserContextProvider } from './context/CredentialParserProvider';
import { CredentialsProvider } from './context/CredentialsContext';
import { OpenID4VCIContextProvider } from './context/OpenID4VCIContext';
import { OpenID4VPContextProvider } from './context/OpenID4VPContext';
import { UriHandler } from './UriHandler';
// Set root element for react-modal
Modal.setAppElement('#root');

ConsoleBehavior();

// Initialize IndexedDB BEFORE React renders
initializeDataSource()
	.then(() => console.log('Database initialized'))
	.catch((err) => console.error('Error initializing database', err));

// Create root and render app
const root = createRoot(document.getElementById('root'));
root.render(
	<StatusProvider>
		<BrowserRouter>
			<SessionContextProvider>
				<CredentialParserContextProvider>
					<CredentialsProvider>
						<OpenID4VPContextProvider>
							<OpenID4VCIContextProvider>
								<UriHandler>
									<App />
								</UriHandler>
							</OpenID4VCIContextProvider>
						</OpenID4VPContextProvider>
					</CredentialsProvider>
				</CredentialParserContextProvider>
			</SessionContextProvider>
		</BrowserRouter>
	</StatusProvider>
);

firebaseSW.register()
