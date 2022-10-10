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
			<Form>
				<Form.Check
					type="switch"
					id="custom-switch"
					label={polyglot.t('Wallet.tab3.dataHub')}
				/>
			</Form>
			<Export polyglot={polyglot} />
			<Button onClick={back} variant="primary" style={{ marginTop: '10px', marginRight: '10px' }}>
				Back
			</Button>
		</div>
	)
}

export default Settings;