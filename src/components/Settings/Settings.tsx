import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import Export from "../ExportQR/ExportFile";
import Polyglot from "node-polyglot";

export const Settings: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const navigate = useNavigate();
	const back = () => {
		navigate('/');
	}

	return (
		<div className="gunet-container">
			<Export polyglot={polyglot} />
		</div>
	)
}

export default Settings;