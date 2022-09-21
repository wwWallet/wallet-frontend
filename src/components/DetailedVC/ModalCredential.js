import React, { Component } from 'react';
import '../../static/style/Diploma.css';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarAlt, faFingerprint, faTag, faUser } from '@fortawesome/free-solid-svg-icons';

class ModalCredential extends Component {
  state = {
    copied: false
  };

  
  componentDidMount = async () => {
    console.log('selectedvc: ', this.props.selectedDiploma);
  };

  handleISODate = (ISODate) => {
    return moment(ISODate).utc().format('YYYY-MM-DD');
  }

  render() {
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
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vc.type`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.type.join(", ")}
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
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vc.issuer`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.issuer}
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
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vc.issuanceDate`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.handleISODate(this.props.selectedDiploma.issued)}
                    </td>
                  </tr>
                  <tr key={"credential-exp-date"}>
                    <td>
                      <strong>
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vc.expirationDate`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.handleISODate(this.props.selectedDiploma.expirationDate)}
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
                        {this.props.polyglot.t(
                          `Organisation.credentialCards.vc.id`
                        )}
                      </strong>
                    </td>
                    <td>
                        {this.props.selectedDiploma.id}
                    </td>
                  </tr>
                  <tr key={"user-did"}>
                    <td>
                      <div className="did-container">
                        <strong>
                          {this.props.polyglot.t(
                            `Organisation.credentialCards.vc.did`
                          )}
                        </strong>
                      </div>
                    </td>
                    <td>
                      {this.props.selectedDiploma.credentialSubject.id}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          {/* <tr key={"signature"} className="diplomaRows">

          </tr> */}
        </tbody>
      </table>
    );
  }
}

export default ModalCredential;
