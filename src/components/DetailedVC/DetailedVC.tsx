import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Card } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import '../CredentialList/CredentialList.css';
import './vcView.css';
import decode from 'jwt-decode';
import { LocationProps } from "../types/LocationProps";
import CustomButton from "../Button/CustomButton";



export const DetailedVC: React.FC = () => {
	var { id } = useParams();
	const navigate = useNavigate();
	const { state } = useLocation() as unknown as LocationProps;
	const goToWallet = useCallback(() => navigate(state?.path || "/", {replace: true}), [navigate]);
	const [vc, setVC] = useState<any>(null);




	const [firstName, setFirstName] = useState<string>("");
	const [familyName, setFamilyName] = useState<string>("");
	const [dateOfBirth, setDateOfBirth] = useState<string>("");
	const [personalIdentifier, setPersonalIdentifier] = useState<string>("");
	const [title, setTitle] = useState<string>("");
	const [grade, setGrade] = useState<string>("");
	const [graduationDate, setGraduationDate] = useState<string>("");
	useEffect(() => {
		console.log('Path: ', state);
		axios.post(`/vc/by-id/${id}`,
		{ ebsi_token: localStorage.getItem('ebsi_token') },
		{ 
				headers : {
					Authorization: `Bearer ${localStorage.getItem('apptoken')}`
		}})
		.then((returnedVC => {

			console.log('Returned vc = ', returnedVC.data.vcJWT);
			const decoded_cred: any = decode(returnedVC.data.vcJWT);
			// console.log()
			console.log(decoded_cred);
			setFirstName(decoded_cred.vc.credentialSubject.firstName);
			setFamilyName(decoded_cred.vc.credentialSubject.familyName);
			setDateOfBirth(decoded_cred.vc.credentialSubject.dateOfBirth);
			setTitle(decoded_cred.vc.credentialSubject.achieved[0].title);
			setPersonalIdentifier(decoded_cred.vc.credentialSubject.personalIdentifier);
			if(decoded_cred.vc.credentialSubject.achieved[0].wasDerivedFrom.length > 0)
				setGrade(decoded_cred.vc.credentialSubject.achieved[0].wasDerivedFrom[0].grade);
			if(decoded_cred.vc.credentialSubject.achieved[0].wasAwardedBy.awardingDate !== undefined)
				setGraduationDate(decoded_cred.vc.credentialSubject.achieved[0].wasAwardedBy.awardingDate.substring(0, 10));
		}))
	}, []);

	return (
		<div className="gunet-container">

			
			<div className="vc-with-back">
				<Card className={ "mb-2 credential-box notselected" }>
					<Card.Body>
						<Card.Title style={{fontWeight: 'bold', textAlign: 'center'}}> Diploma Verifiable Credential </Card.Title>

						<div style={{marginTop: '20px'}}>



							<Card.Text style={{fontWeight: 'bold'}}> First Name </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>

							<Card.Text style={{fontStyle: 'italic', fontWeight: ''}}> { firstName } </Card.Text>
							</div>

							<Card.Text style={{fontWeight: 'bold'}}> Family Name </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>

							<Card.Text style={{fontStyle: 'italic'}}> { familyName } </Card.Text>
							</div>


							<Card.Text style={{fontWeight: 'bold'}}> TIN </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>
								<Card.Text style={{fontStyle: 'italic'}}> { personalIdentifier }  </Card.Text>
							</div>


							<Card.Text style={{fontWeight: 'bold'}}> Date of birth </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>
								<Card.Text style={{fontStyle: 'italic'}}> { dateOfBirth } </Card.Text>
							</div>

							<Card.Text style={{fontWeight: 'bold'}}> Diploma Title </Card.Text>
							<div style={{marginTop: '-15px', marginBottom: '20px'}}>
								<Card.Text style={{fontStyle: 'italic'}}> { title } </Card.Text>
							</div>

							{grade !== "" &&
								<React.Fragment>
									<Card.Text style={{fontWeight: 'bold'}}> Grade </Card.Text>
									<div style={{marginTop: '-15px', marginBottom: '20px'}}>
										<Card.Text style={{fontStyle: 'italic'}}> { grade } </Card.Text>
									</div>
								</React.Fragment>
							}

							{graduationDate !== "" &&
								<React.Fragment>
									<Card.Text style={{fontWeight: 'bold'}}> Graduation Date </Card.Text>
									<div style={{marginTop: '-15px', marginBottom: '20px'}}>
										<Card.Text style={{fontStyle: 'italic'}}> { graduationDate } </Card.Text>
									</div>
								</React.Fragment>
							}

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

export default DetailedVC;
