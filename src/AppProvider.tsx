// RootProvider.tsx
import React, { ReactNode } from 'react';
import { StatusContextProvider } from './context/StatusContextProvider';
import { SessionContextProvider } from './context/SessionContextProvider';
import { CredentialParserContextProvider } from './context/CredentialParserProvider';
import { CredentialsContextProvider } from './context/CredentialsContextProvider';
import { OpenID4VPContextProvider } from './context/OpenID4VPContextProvider';
import { OpenID4VCIContextProvider } from './context/OpenID4VCIContextProvider';
import UriHandler from './hocs/UriHandler';

type RootProviderProps = {
	children: ReactNode;
};

const AppProvider: React.FC<RootProviderProps> = ({ children }) => {
	return (
		<StatusContextProvider>
			<SessionContextProvider>
				<CredentialParserContextProvider>
					<CredentialsContextProvider>
						<OpenID4VPContextProvider>
							<OpenID4VCIContextProvider>
								<UriHandler>
									{children}
								</UriHandler>
							</OpenID4VCIContextProvider>
						</OpenID4VPContextProvider>
					</CredentialsContextProvider>
				</CredentialParserContextProvider>
			</SessionContextProvider>
		</StatusContextProvider>
	);
};

export default AppProvider;
