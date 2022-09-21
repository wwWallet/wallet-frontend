import React, { Component } from 'react';
import '../../static/style/Diploma.css';

import '../../static/style/PresentationCredentialCards.css';
import '../../static/style/Scopes.css';
import '../../static/style/TokenEntry.css';
import '../../static/style/Gunet.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowDown, faArrowUp, faBars, faCalendarAlt, faFingerprint, faTimes, faUser } from '@fortawesome/free-solid-svg-icons'

class ModalVID extends Component {
  
  componentDidMount = async () => {
    console.log('selectedvc: ', this.props.selectedDiploma);
  };

  render() {
    return (
      // <div className="gunet-container detailed">
      //   <div className="header">
      //     <h4>VID{/*props.polyglot.t('Organisation.degree')* /}</h4>
      //     <button type="button">
      //       <FontAwesomeIcon icon={faTimes} />
      //     </button>
      //   </div>
      //   <div className="content" onClick={(e) => e.stopPropagation()}>
      //     <div>
      //       <div
      //         id="diploma"
      //       >
              <table className="diploma-table">
                <tbody>
                  <tr key={"vid-subject"} className="diplomaRows">
                    <td className="side_description">
                      {/* <span className={`fas fa-user`} /> */}
                      <FontAwesomeIcon icon={faUser} />
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
                          <tr key={"birthdate"}>
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

                  <tr key={"identification"} className="diplomaRows">
                    <td className="side_description">
                      {/* <span className={`fas fa-fingerprint`} /> */}
                      <FontAwesomeIcon icon={faFingerprint} />
                    </td>
                    <td className="inner-td">
                      <table className="table compact inner-table">
                        <tbody>
                          <tr key={"user-tax-number"}>
                            <td>
                              <strong>
                                {this.props.polyglot.t(
                                  `Organisation.credentialCards.vid.tin`
                                )}
                              </strong>
                            </td>
                            <td>
                                {this.props.selectedDiploma.credentialSubject.personalIdentifier}
                            </td>
                          </tr>
                          <tr key={"user-did"}>
                            <td>
                              <strong>
                                {this.props.polyglot.t(
                                  `Organisation.credentialCards.vc.did`
                                )}
                              </strong>
                            </td>
                            <td>
                              <div className="did-container">
                                {this.props.selectedDiploma.credentialSubject.id}
                              </div>
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
      //      </div>
      //     </div>
      //   </div>
      // </div>
    );
  }
}

export default ModalVID;
