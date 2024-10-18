import React, { createContext } from 'react';
import { ContainerContextValue, useContainer } from '../hooks/useContainer';


const ContainerContext: React.Context<ContainerContextValue> = createContext(null);

export const ContainerContextProvider = ({ children }) => {

	const { container } = useContainer();

	return (
		<ContainerContext.Provider value={container}>
			{children}
		</ContainerContext.Provider>
	);
}

export default ContainerContext;
