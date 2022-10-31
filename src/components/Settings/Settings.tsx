import React from "react";
import Export from "../ExportQR/ExportFile";
import Polyglot from "node-polyglot";

export const Settings: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	return (
		<div className="gunet-container">
			{/* <Export polyglot={polyglot} /> */}
		</div>
	)
}

export default Settings;