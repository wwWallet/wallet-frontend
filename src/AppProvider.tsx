// AppProvider.tsx
import React, { ReactNode } from 'react';

// Import i18next and set up translations
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Contexts
import { StatusContextProvider } from './context/StatusContextProvider';
import { SessionContextProvider } from './context/SessionContextProvider';
import { CredentialsContextProvider } from './context/CredentialsContextProvider';
import { OpenID4VPContextProvider } from './context/OpenID4VPContextProvider';
import { OpenID4VCIContextProvider } from './context/OpenID4VCIContextProvider';
import { AppSettingsProvider } from './context/AppSettingsProvider';
import { NotificationProvider } from './context/NotificationProvider';
import { WebauthnInteractionDialogContextProvider } from './context/WebauthnInteractionDialogContext';

// Hocs
import { UriHandlerProvider } from './hocs/UriHandlerProvider';
import { NativeWrapperProvider } from './hocs/NativeWrapperProvider';

type RootProviderProps = {
	children: ReactNode;
};

const AppProvider: React.FC<RootProviderProps> = ({ children }) => {
	return (
		<StatusContextProvider>
			<WebauthnInteractionDialogContextProvider>
				<SessionContextProvider>
					<CredentialsContextProvider>
						<I18nextProvider i18n={i18n}>
							<OpenID4VPContextProvider>
								<OpenID4VCIContextProvider>
									<UriHandlerProvider>
										<AppSettingsProvider>
											<NotificationProvider>
												<NativeWrapperProvider>
													{children}
												</NativeWrapperProvider>
											</NotificationProvider>
										</AppSettingsProvider>
									</UriHandlerProvider>
								</OpenID4VCIContextProvider>
							</OpenID4VPContextProvider>
						</I18nextProvider>
					</CredentialsContextProvider>
				</SessionContextProvider>
			</WebauthnInteractionDialogContextProvider>
		</StatusContextProvider>
	);
};

export default AppProvider;
