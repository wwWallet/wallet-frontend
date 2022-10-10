import axios from 'axios';
import React, { useCallback, useRef, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { importRequestDTO, importResponseDTO } from '../../interfaces/import-export-dto';
import CustomButton from '../Button/CustomButton';
import './Modals.css';
import Polyglot from 'node-polyglot';

interface ModalInterface {
    show: boolean;
    success: boolean;
}

const Import: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const [loading, setLoading] = useState<boolean>(false);
    const [fileContent, setFileContent] = useState<string>("");
    const passphrase = useRef<HTMLInputElement>(null);

    const [modalState, setModalState] = useState<ModalInterface>({show: false, success: false});

    const importFile = async () => {
        setLoading(true);
        const pass = passphrase.current?.value;
        if (pass === undefined || pass === "") {
            throw new Error('Password not given');
        }
        const requestPayload: importRequestDTO = {
            payload: fileContent,
            password: pass
        }
        await axios.post<importResponseDTO>(`/import`,requestPayload
        ).then(res => {
                console.log(res.data);
                if(res.data.success)
                    localStorage.setItem("did", res.data.did);
                else
                    throw new Error('File import failed!')
                
                setLoading(false);
                setModalState({show:true,success:true})
                // goToLogin();
          })
          .catch(err => {
            console.log('err = ', err);
            setLoading(false);
            setModalState({show:true,success:false})
          });
    }

    const navigate = useNavigate();
    const goToLogin = useCallback(() => navigate("/login", {replace: true}), [navigate]);

    const handleClose = () => {closeModal()}

    const closeModal = () => {setModalState({show: false, success: false})}

    const showFile = async (e: React.ChangeEvent<HTMLInputElement>) => {

        e.preventDefault()
        const reader = new FileReader()
        reader.onload = async (e: ProgressEvent<FileReader>) => {

            if (e === null || e.target === null) {
                throw new Error('Cannot read file.')
            }
            const text = (e.target.result);
            setFileContent(text ? text.toString(): "");
        };

        if (e === null || e.target === null || e.target.files === null) {
            throw new Error('Cannot read file.')
        }
        reader.readAsText(e.target.files[0])
    }

    return (
        <div className = "gunet-container">
            <div className="container">
                <div className="row">
                    <Modal show={modalState.show} onHide={goToLogin}>
                        <Modal.Header closeButton className={modalState.success ? "modal-success" : "modal-fail"}>
                        <Modal.Title>{polyglot.t('Import.'+(modalState.success ? "success" : "error"))}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>{polyglot.t('Import.'+(modalState.success ? "success" : "error")+"Text")}</Modal.Body>
                        <Modal.Footer>
                        { !modalState.success &&    // only show 'Try again' button if import failed
                            <Button variant="secondary" onClick={handleClose}>
                                {polyglot.t('Import.buttonTryAgain')}
                            </Button>
                        }
                        <Button variant="secondary" onClick={goToLogin}>
                                {polyglot.t('Import.buttonReturnLogin')}
                        </Button>
                        </Modal.Footer>
                    </Modal>
                    <h3>{polyglot.t('Import.header')}</h3>
                    <input type="file" onChange={(e) => showFile(e)}/>
                        {polyglot.t('Import.passphrase')}
                    <input ref={passphrase} type="password" id="passphrase" aria-describedby="basic-addon3" style={{"width": "5%", "minWidth": "200px"}}/>
                    <Button onClick={importFile} variant="light" style={{marginTop: '10px'}}>
                        {polyglot.t('Import.buttonImport')}
                    </Button>
                </div>
            </div>
        </div>
    )

}

export default Import;