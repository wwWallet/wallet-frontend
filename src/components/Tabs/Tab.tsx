import React from "react";

export interface TabPropsInterface {
	tabId: number | string;
	activeId: number | string;
	children: JSX.Element;
}

const Tab: React.FC<TabPropsInterface> = ({tabId, activeId, children}) => {
	return ((activeId === tabId) ? children : null);
}

export default Tab;