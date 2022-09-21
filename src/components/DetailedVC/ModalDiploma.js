import React, { Component } from 'react';
import '../../static/style/Diploma.css';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAward, faCalendarAlt, faGraduationCap, faUniversity, faUserGraduate } from '@fortawesome/free-solid-svg-icons';

class ModalDiploma extends Component {

  componentDidMount = async () => {
    console.log('selectedvc: ', this.props.selectedDiploma);
  };

  handleGrade = (fullGrade) => {
    const gradeValue = fullGrade.split('(')[1].split(')')[0];
    const gradeDescription = fullGrade.split('(')[0];

    return {
      gradeValue: gradeValue,
      gradeDescription: gradeDescription
    }
  }

  handleLevel = (fullLevel) => {
    return fullLevel.substring(fullLevel.indexOf('eqf/')+4);
  }

  handleISODate = (ISODate) => {
    return moment(ISODate).utc().format('YYYY-MM-DD');
  }

  render() {
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
                  {/* <tr key={"issuer-unit"}>
                    <td>
                      <strong>
                        {/ * {this.props.polyglot.t(
                          `diplomaFields.${item.name}`
                        )} * /}
                        Issuer Unit
                      </strong>
                    </td>
                    <td>
                      {/ * {item.name === 'level'
                        ? this.props.polyglot.t(
                            `educationalLevels.${item.value}`
                          )
                        : item.value} * /}
                        unit
                    </td>
                  </tr>
                  <tr key={"issuer-institution"}>
                    <td>
                      <strong>
                        {/ * {this.props.polyglot.t(
                          `diplomaFields.${item.name}`
                        )} * /}
                        Issuer Institution
                      </strong>
                    </td>
                    <td>
                      {/ * {item.name === 'level'
                        ? this.props.polyglot.t(
                            `educationalLevels.${item.value}`
                          )
                        : item.value} * /}
                        inst
                    </td>
                  </tr> */}
                  <tr key={"issuer-blueprint"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.diploma.issuerBlueprint`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.credentialSubject.achieved[0].specifiedBy[0].id}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr key={"title"} className="diplomaRows">
            <td className="side_description">
              {/* <span className={`fas fa-graduation-cap`} /> */}
              <FontAwesomeIcon icon={faGraduationCap} />
            </td>
            <td className="inner-td">
              <table className="table compact inner-table">
                <tbody>
                  <tr key={"title-level"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.diploma.qualificationLevel`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.handleLevel(this.props.selectedDiploma.credentialSubject.achieved[0].specifiedBy[0].eqfLevel)}
                    </td>
                  </tr>
                  <tr key={"title-title"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.diploma.degreeTitle`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.credentialSubject.achieved[0].specifiedBy[0].title}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr key={"diploma-subject"} className="diplomaRows">
            <td className="side_description">
              {/* <span className={`fas fa-user-graduate`} /> */}
              <FontAwesomeIcon icon={faUserGraduate} />
            </td>
            <td className="inner-td">
              <table className="table compact inner-table">
                <tbody>
                  <tr key={"subject-name"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vid.name`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.credentialSubject.firstName}
                    </td>
                  </tr>
                  <tr key={"subject-surname"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vid.surname`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.credentialSubject.familyName}
                    </td>
                  </tr>
                  <tr key={"subject-birthdate"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vid.dateOfBirth`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.credentialSubject.dateOfBirth}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {this.props.selectedDiploma.credentialSubject.achieved[0].wasDerivedFrom.length > 0 &&
          <tr key={"grade"} className="diplomaRows">
            <td className="side_description">
              {/* <span className={`fas fa-award`} /> */}
              <FontAwesomeIcon icon={faAward} />
            </td>
            <td className="inner-td">
              <table className="table compact inner-table">
                <tbody>
                  <tr key={"grade-value"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.diploma.gradeValue`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.handleGrade(this.props.selectedDiploma.credentialSubject.achieved[0].wasDerivedFrom[0].grade).gradeValue}
                    </td>
                  </tr>
                  <tr key={"grade-description"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.diploma.gradeDescription`
                        )}
                      </strong>
                    </td>
                    <td>
                    {this.handleGrade(this.props.selectedDiploma.credentialSubject.achieved[0].wasDerivedFrom[0].grade).gradeDescription}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>}

          {this.props.selectedDiploma.credentialSubject.achieved[0].wasAwardedBy !== "" &&
          <tr key={"dates"} className="diplomaRows">
            <td className="side_description">
              {/* <span className={`fas fa-calendar-alt`} /> */}
              <FontAwesomeIcon icon={faCalendarAlt} />
            </td>
            <td className="inner-td">
              <table className="table compact inner-table">
                <tbody>
                  <tr key={"issuance-date"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vc.issuanceDate`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.handleISODate(this.props.selectedDiploma.credentialSubject.achieved[0].wasAwardedBy.awardingDate)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>}

          {/* <tr key={"signature"} className="diplomaRows">
          </tr> */}
        </tbody>
      </table>
  );
  }
}

export default ModalDiploma;
