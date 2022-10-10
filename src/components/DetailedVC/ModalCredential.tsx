import React, { Component } from 'react';
import './Diploma.css';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt, faFingerprint, faTag, faUser } from '@fortawesome/free-solid-svg-icons';
import { ModalProps } from './ModalVID';

const ModalCredential: React.FC<ModalProps> = ({ polyglot, selectedVC }) => {

	const handleISODate = (ISODate: string) => {
		return moment(ISODate).utc().format('YYYY-MM-DD');
	}

	return (
		<table className="general-vc-table">
			<tbody>
				<tr key={"type"} className="diplomaRows">
					<td className="side_description">
						{/* <span className={`fas fa-tag`} /> */}
						<FontAwesomeIcon icon={faTag} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"credential-type"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vc.type`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.type.join(", ")}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"issuer"} className="diplomaRows">
					<td className="side_description">
						{/* <span className={`fas fa-user`} /> */}
						<FontAwesomeIcon icon={faUser} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"credential-issuer"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vc.issuer`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.issuer}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"dates"} className="diplomaRows">
					<td className="side_description">
						{/* <span className={`fas fa-calendar-alt`} /> */}
						<FontAwesomeIcon icon={faCalendarAlt} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"credential-iss-date"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vc.issuanceDate`
											)}
										</strong>
									</td>
									<td>
										{handleISODate(selectedVC.issued)}
									</td>
								</tr>
								<tr key={"credential-exp-date"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vc.expirationDate`
											)}
										</strong>
									</td>
									<td>
										{handleISODate(selectedVC.expirationDate)}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"identification"} className="diplomaRows">
					<td className="side_description">
						{/* <span className={`fas fa-fingerprint`} /> */}
						<FontAwesomeIcon icon={faFingerprint} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"credential-id"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.vc.id`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.id}
									</td>
								</tr>
								<tr key={"user-did"}>
									<td>
										<div className="did-container">
											<strong>
												{polyglot.t(
													`Organisation.credentialCards.vc.did`
												)}
											</strong>
										</div>
									</td>
									<td>
										{selectedVC.credentialSubject.id}
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

export default ModalCredential;