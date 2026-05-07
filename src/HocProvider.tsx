import React, { PropsWithChildren } from 'react';
import { UriHandlerProvider } from './hocs/UriHandlerProvider';
import { NativeWrapperProvider } from './hocs/NativeWrapperProvider';

export const HocProvider: React.FC<PropsWithChildren> = ({ children }) => (
	<UriHandlerProvider>
		<NativeWrapperProvider>
			{children}
		</NativeWrapperProvider>
	</UriHandlerProvider>
);
