// AppProvider.tsx
import React, { ReactNode } from 'react';
import { StatusContextProvider } from './context/StatusContextProvider';
import { SessionContextProvider } from './context/SessionContextProvider';
import { CredentialsContextProvider } from './context/CredentialsContextProvider';
import { OpenID4VPContextProvider } from './context/OpenID4VPContextProvider';
import { OpenID4VCIContextProvider } from './context/OpenID4VCIContextProvider';
import { AppSettingsProvider } from './context/AppSettingsProvider';
import { NotificationProvider } from './context/NotificationProvider';
import { NativeWrapperProvider } from './context/NativeWrapper';

import UriHandler from './hocs/UriHandler';

type RootProviderProps = {
	children: ReactNode;
};

const AppProvider: React.FC<RootProviderProps> = ({ children }) => {
	return (
		<StatusContextProvider>
			<SessionContextProvider>
				<CredentialsContextProvider>
					<OpenID4VPContextProvider>
						<OpenID4VCIContextProvider>
							<UriHandler>
								<AppSettingsProvider>
									<NotificationProvider>
										<NativeWrapperProvider>
											{children}
										</NativeWrapperProvider>
									</NotificationProvider>
								</AppSettingsProvider>
							</UriHandler>
						</OpenID4VCIContextProvider>
					</OpenID4VPContextProvider>
				</CredentialsContextProvider>
			</SessionContextProvider>
		</StatusContextProvider>
	);
};

export default AppProvider;
