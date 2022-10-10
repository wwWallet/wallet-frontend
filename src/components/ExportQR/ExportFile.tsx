import axios from 'axios';
import Polyglot from 'node-polyglot';
import React, { useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { exportRequestDTO } from '../../interfaces/import-export-dto';
import CustomButton from '../Button/CustomButton';

const Export: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const [modal, setModal] = useState<boolean>(false);
    const passphrase = useRef<HTMLInputElement>(null);

    const exportModal = () => {
        setModal(true);
    }

    const exportWallet = async () => {
        console.log('clickk');
        const pass = passphrase.current?.value;
        if (pass === undefined || pass === "") {
            throw new Error('Password not given');
        }

        const did = localStorage.getItem("did");
        if (did === null) {
            throw new Error('did not found');
        }

        console.log('given pass: ', pass);
        const requestPayload: exportRequestDTO = {
            did: did,
            password: pass
        }

        // Check if password matches with current pass
        await axios.post(`/user-wallet-auth/checkpw`, requestPayload
        ).then(
            async res => {
                if (res.data === true) {

                    // If passwords match, then proceed with exporting file
                    await axios.post(`/exp`, requestPayload
                    ).then(res => {
                        setModal(false);
                        window.location.replace(`/exp/` + res.data);
                    })
                        .catch(err => {
                            console.log('err = ', err);
                        });

                }
                else {
                    console.log('passwords DO NOT match!');
                }
            })
            .catch(err => {
                console.log('err = ', err);
            })
    }

    return (
        <React.Fragment>
            <CustomButton buttonDisabled={false} text={polyglot.t('Export.buttonExport')} onClick={exportModal} />
            <Modal show={modal}>
                <Modal.Header closeButton onHide={() => setModal(false)}>
                    <Modal.Title>{polyglot.t('Export.confirmExport')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{polyglot.t('Export.passphrasePrompt')}</p>
                    <input ref={passphrase} type="password" id="passphrase" aria-describedby="basic-addon3" style={{ "width": "5%", "minWidth": "200px" }} />
                </Modal.Body>
                <Modal.Footer>
                    <CustomButton buttonDisabled={false} text={polyglot.t('Export.buttonExport')} onClick={exportWallet} />
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    )

}

export default Export;