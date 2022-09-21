import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form } from "react-bootstrap";

export const Settings: React.FC = () => {
    
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
                    label="Store my Verifiable Credentials into the ID Data Hub"
                />
            </Form>
            <Button onClick={back} variant="primary" style={{marginTop: '10px', marginRight: '10px'}}>
                Back
            </Button>
        </div>
    )
}

export default Settings;