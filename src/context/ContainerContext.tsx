import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { ContainerContextValue, useContainer } from '../components/useContainer';


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
