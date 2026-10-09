// AppProvider.tsx
import React, { ReactNode, Suspense, useContext } from 'react';

// Import i18next and set up translations
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Contexts
import { StatusContextProvider } from './context/StatusContextProvider';
import { SessionContextProvider } from './context/SessionContextProvider';
import { AppSettingsProvider } from './context/AppSettingsProvider';
import { NotificationProvider } from './context/NotificationProvider';
import SessionContext from './context/SessionContext';

// Hocs
import { NativeWrapperProvider } from './hocs/NativeWrapperProvider';
import Spinner from './components/Shared/Spinner';

const WalletRuntimeProvider = React.lazy(() => import('./hocs/WalletRuntimeProvider'));

type RootProviderProps = {
	children: ReactNode;
};

const AuthenticatedWalletRuntime: React.FC<RootProviderProps> = ({ children }) => {
	const { isLoggedIn } = useContext(SessionContext);

	if (!isLoggedIn) {
		return children;
	}

	return (
		<Suspense fallback={<Spinner />}>
			<WalletRuntimeProvider>
				{children}
			</WalletRuntimeProvider>
		</Suspense>
	);
};

const AppProvider: React.FC<RootProviderProps> = ({ children }) => {
	return (
		<StatusContextProvider>
			<SessionContextProvider>
				<I18nextProvider i18n={i18n}>
					<AppSettingsProvider>
						<NotificationProvider>
							<NativeWrapperProvider>
								<AuthenticatedWalletRuntime>
									{children}
								</AuthenticatedWalletRuntime>
							</NativeWrapperProvider>
						</NotificationProvider>
					</AppSettingsProvider>
				</I18nextProvider>
			</SessionContextProvider>
		</StatusContextProvider>
	);
};

export default AppProvider;
