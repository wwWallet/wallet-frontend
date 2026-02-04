import { useEffect } from 'react';

import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import keystoreEvents from '../services/keystoreEvents';


declare global {
	interface Window {
		nativeWrapper?: NativeWrapper;
	}

	interface NativeWrapper {
		isKeystoreOpen(): Promise<boolean>;
	}
}


export const NativeWrapperProvider = ({ children }) => {
	const keystore = useLocalStorageKeystore(keystoreEvents);

	useEffect(
		() => {
			if (window.nativeWrapper) {
				window.nativeWrapper.isKeystoreOpen = async () => keystore.isOpen();
			}
		},
		[keystore],
	);

	return children;
};
