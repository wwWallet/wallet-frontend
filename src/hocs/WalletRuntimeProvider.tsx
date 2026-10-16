import React from 'react';

import { CredentialsContextProvider } from '@/context/CredentialsContextProvider';
import { OpenID4VCIContextProvider } from '@/context/OpenID4VCIContextProvider';
import { OpenID4VPContextProvider } from '@/context/OpenID4VPContextProvider';
import { UriHandlerProvider } from './UriHandlerProvider';

const WalletRuntimeProvider = ({ children }: React.PropsWithChildren) => (
	<CredentialsContextProvider>
		<OpenID4VPContextProvider>
			<OpenID4VCIContextProvider>
				<UriHandlerProvider>{children}</UriHandlerProvider>
			</OpenID4VCIContextProvider>
		</OpenID4VPContextProvider>
	</CredentialsContextProvider>
);

export default WalletRuntimeProvider;
