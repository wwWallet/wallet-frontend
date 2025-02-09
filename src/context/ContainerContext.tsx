import React, { createContext } from "react";
import { withCredentialParserContext } from "./CredentialParserContext";

export type ContainerContextValue = {}

const ContainerContext: React.Context<ContainerContextValue> = createContext({});

export const ContainerContextProvider = ({ children }) => {

	return (
		<ContainerContext.Provider value={{}}>
			{children}
		</ContainerContext.Provider>
	);
}

export const withContainerContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	withCredentialParserContext((props) => (
			<ContainerContextProvider>
				<Component {...props} />
			</ContainerContextProvider>
		)
	)

export default ContainerContext;
