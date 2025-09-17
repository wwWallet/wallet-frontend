// RootProvider.tsx
import React, { ReactNode } from 'react';
import { StatusContextProvider } from './context/StatusContextProvider';
import { SessionContextProvider } from './context/SessionContextProvider';
import { CredentialsContextProvider } from './context/CredentialsContextProvider';
import { OpenID4VPContextProvider } from './context/OpenID4VPContextProvider';
import { OpenID4VCIContextProvider } from './context/OpenID4VCIContextProvider';
import { AppSettingsProvider } from './context/AppSettingsProvider';
import UriHandler from './hocs/UriHandler';
import { WebauthnInteractionDialogContextProvider } from './context/WebauthnInteractionDialogContext';

type RootProviderProps = {
	children: ReactNode;
};

const AppProvider: React.FC<RootProviderProps> = ({ children }) => {
	return (
		<StatusContextProvider>
			<WebauthnInteractionDialogContextProvider>
				<SessionContextProvider>
					<CredentialsContextProvider>
						<OpenID4VPContextProvider>
							<OpenID4VCIContextProvider>
								<UriHandler>
									<AppSettingsProvider>
										{children}
									</AppSettingsProvider>
								</UriHandler>
							</OpenID4VCIContextProvider>
						</OpenID4VPContextProvider>
					</CredentialsContextProvider>
				</SessionContextProvider>
			</WebauthnInteractionDialogContextProvider>
		</StatusContextProvider>
	);
};

export default AppProvider;
