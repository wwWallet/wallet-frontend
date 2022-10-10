import React from 'react';
import './Diploma.css';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAward, faCalendarAlt, faGraduationCap, faUniversity, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import { ModalProps } from './ModalVID';

const ModalDiploma: React.FC<ModalProps> = ({polyglot, selectedVC}) => {

	const handleGrade = (fullGrade: string) => {
		const gradeValue = fullGrade.split('(')[1].split(')')[0];
		const gradeDescription = fullGrade.split('(')[0];

		return {
			gradeValue: gradeValue,
			gradeDescription: gradeDescription
		}
	}

	const handleLevel = (fullLevel: string) => {
		return fullLevel.substring(fullLevel.indexOf('eqf/') + 4);
	}

	const handleISODate = (ISODate: string) => {
		return moment(ISODate).utc().format('YYYY-MM-DD');
	}

	return (
		<table className="diploma-table" onClick={(e) => e.stopPropagation()}>
			<tbody>
				<tr key={"issuer"} className="diplomaRows">
					<td className="side_description">
						{/* <span className={`fas fa-university`} /> */}
						<FontAwesomeIcon icon={faUniversity} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"issuer-blueprint"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.diploma.issuerBlueprint`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.credentialSubject.achieved[0].specifiedBy[0].id}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"title"} className="diplomaRows">
					<td className="side_description">
						<FontAwesomeIcon icon={faGraduationCap} />
					</td>
					<td className="inner-td">
						<table className="table compact inner-table">
							<tbody>
								<tr key={"title-level"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.diploma.qualificationLevel`
											)}
										</strong>
									</td>
									<td>
										{handleLevel(selectedVC.credentialSubject.achieved[0].specifiedBy[0].eqfLevel)}
									</td>
								</tr>
								<tr key={"title-title"}>
									<td>
										<strong>
											{polyglot.t(
												`Organisation.credentialCards.diploma.degreeTitle`
											)}
										</strong>
									</td>
									<td>
										{selectedVC.credentialSubject.achieved[0].specifiedBy[0].title}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>

				<tr key={"diploma-subject"} className="diplomaRows">
					<td className="side_description">
						<FontAwesomeIcon icon={faUserGraduate} />
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
								<tr key={"subject-birthdate"}>
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

				{selectedVC.credentialSubject.achieved[0].wasDerivedFrom.length > 0 &&
					<tr key={"grade"} className="diplomaRows">
						<td className="side_description">
							<FontAwesomeIcon icon={faAward} />
						</td>
						<td className="inner-td">
							<table className="table compact inner-table">
								<tbody>
									<tr key={"grade-value"}>
										<td>
											<strong>
												{polyglot.t(
													`Organisation.credentialCards.diploma.gradeValue`
												)}
											</strong>
										</td>
										<td>
											{handleGrade(selectedVC.credentialSubject.achieved[0].wasDerivedFrom[0].grade).gradeValue}
										</td>
									</tr>
									<tr key={"grade-description"}>
										<td>
											<strong>
												{polyglot.t(
													`Organisation.credentialCards.diploma.gradeDescription`
												)}
											</strong>
										</td>
										<td>
											{handleGrade(selectedVC.credentialSubject.achieved[0].wasDerivedFrom[0].grade).gradeDescription}
										</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>}

				{selectedVC.credentialSubject.achieved[0].wasAwardedBy !== "" &&
					<tr key={"dates"} className="diplomaRows">
						<td className="side_description">
							<FontAwesomeIcon icon={faCalendarAlt} />
						</td>
						<td className="inner-td">
							<table className="table compact inner-table">
								<tbody>
									<tr key={"issuance-date"}>
										<td>
											<strong>
												{polyglot.t(
													`Organisation.credentialCards.vc.issuanceDate`
												)}
											</strong>
										</td>
										<td>
											{handleISODate(selectedVC.credentialSubject.achieved[0].wasAwardedBy.awardingDate)}
										</td>
									</tr>
								</tbody>
							</table>
						</td>
					</tr>}
			</tbody>
		</table>
	);

}

export default ModalDiploma;
