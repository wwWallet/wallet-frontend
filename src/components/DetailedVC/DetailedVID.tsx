import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import '../CredentialList/CredentialList.css';
import './vcView.css';
import decode from 'jwt-decode';
import { LocationProps } from "../types/LocationProps";
import CustomButton from "../Button/CustomButton";
import ModalVID from "./ModalVID";
import Polyglot from "node-polyglot";



export const DetailedVID: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {
	var { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation() as unknown as LocationProps;
	const goToWallet = useCallback(() => navigate(state?.path || "/", {replace: true}), [navigate]);


	const [firstName, setFirstName] = useState<string>("");
	const [familyName, setFamilyName] = useState<string>("");
	const [dateOfBirth, setDateOfBirth] = useState<string>("");
	const [tin, setTIN] = useState<string>("");

	const [credential, setCredential] = useState({});


	useEffect(() => {
		console.log('Path: ', state);
		axios.post(`/vc/by-id/${id}`,
		{ ebsi_token: localStorage.getItem('ebsi_token') },
		{ 
				headers : {
					Authorization: `Bearer ${localStorage.getItem('appToken')}`
		}})
		.then((returnedVC => {

			console.log('Returned vc = ', returnedVC.data.vcJWT);
			const decoded_cred: any = decode(returnedVC.data.vcJWT);

			setFirstName(decoded_cred.vc.credentialSubject.firstName);
			setFamilyName(decoded_cred.vc.credentialSubject.familyName);
			setDateOfBirth(decoded_cred.vc.credentialSubject.dateOfBirth);
			setTIN(decoded_cred.vc.credentialSubject.personalIdentifier);
			setCredential(decoded_cred.vc);
			console.log(decoded_cred);

		}))
	}, []);

	return (
		<div className="gunet-container">

			{Object.keys(credential).length !== 0 &&
				<ModalVID polyglot={polyglot} selectedDiploma={credential}/>
			}
			
			<div className="vc-with-back">
				<Card className={ "mb-2 credential-box notselected" }>
					<Card.Body>
						<Card.Title style={{fontWeight: 'bold', textAlign: 'center'}}> Verifiable ID </Card.Title>

						<div style={{marginTop: '20px'}}>



							<Card.Text style={{fontWeight: 'bold'}}> First Name </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>

							<Card.Text style={{fontStyle: 'italic'}}> { firstName } </Card.Text>
							</div>

							<Card.Text style={{fontWeight: 'bold'}}> Family Name </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>

							<Card.Text style={{fontStyle: 'italic'}}> { familyName } </Card.Text>
							</div>


							<Card.Text style={{fontWeight: 'bold'}}> Taxpayer Identification Number (TIN)</Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>
								<Card.Text style={{fontStyle: 'italic'}}> { tin }  </Card.Text>
							</div>

							<Card.Text style={{fontWeight: 'bold'}}> Date of birth </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>
								<Card.Text style={{fontStyle: 'italic'}}> { dateOfBirth } </Card.Text>
							</div>
						</div>
					</Card.Body>
				</Card>
				<div className="back-button">
				
					<CustomButton text='Back' buttonDisabled={false} onClick={() => goToWallet()}/>

				</div>

			</div>
		</div>
	);
}

export default DetailedVID;