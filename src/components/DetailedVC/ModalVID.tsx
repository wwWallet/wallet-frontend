import React from 'react';
import './Diploma.css';

import './Scopes.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faBars, faCalendarAlt, faFingerprint, faTimes, faUser } from '@fortawesome/free-solid-svg-icons'
import Polyglot from 'node-polyglot';

export interface ModalProps {
	polyglot: Polyglot,
	selectedVC: any
}

const ModalVID: React.FC<ModalProps> = ({ polyglot, selectedVC }) => {

	return (
		<table className="diploma-table">
			<tbody>
				<tr key={"vid-subject"} className="diplomaRows">
					<td className="side_description">
						<FontAwesomeIcon icon={faUser} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"subject-name"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vid.name`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.credentialSubject.firstName}
									</td>
								</tr>
								<tr key={"subject-surname"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vid.surname`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.credentialSubject.familyName}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"dates"} className="diplomaRows">
					<td className="side_description">
						<FontAwesomeIcon icon={faCalendarAlt} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"birthdate"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vid.dateOfBirth`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.credentialSubject.dateOfBirth}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"identification"} className="diplomaRows">
					<td className="side_description">
						<FontAwesomeIcon icon={faFingerprint} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"user-tax-number"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vid.tin`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.credentialSubject.personalIdentifier}
									</td>
								</tr>
								<tr key={"user-did"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vc.did`
											)}
										</strong>
									</td>
									<td>
										<div className="did-container">
											{selectedVC.credentialSubject.id}
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

export default ModalVID;
