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
import { OIDFlowTransportProviderWrapper } from './context/OIDFlowTransportProviderWrapper';
import { WebSocketSignHandlerProvider } from './context/WebSocketSignHandlerProvider';
import { ErrorDialogContextProvider } from './context/ErrorDialogContextProvider';
import { TxCodeInputProvider } from './context/TxCodeInputContext';

type RootProviderProps = {
	children: ReactNode;
};

const AppProvider: React.FC<RootProviderProps> = ({ children }) => {
	return (
		<StatusContextProvider>
			<SessionContextProvider>
				<CredentialsContextProvider>
					<OIDFlowTransportProviderWrapper>
						<WebSocketSignHandlerProvider>
							<I18nextProvider i18n={i18n}>
								<ErrorDialogContextProvider>
									<OpenID4VPContextProvider>
										<OpenID4VCIContextProvider>
											<TxCodeInputProvider>
												<NotificationProvider>
													<AppSettingsProvider>
														{children}
													</AppSettingsProvider>
												</NotificationProvider>
											</TxCodeInputProvider>
										</OpenID4VCIContextProvider>
									</OpenID4VPContextProvider>
								</ErrorDialogContextProvider>
							</I18nextProvider>
						</WebSocketSignHandlerProvider>
					</OIDFlowTransportProviderWrapper>
				</CredentialsContextProvider>
			</SessionContextProvider>
		</StatusContextProvider>
	);
};

export default AppProvider;
