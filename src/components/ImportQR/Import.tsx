import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { importQRResponseDTO } from '../../interfaces/import-export-dto';
import '../../static/style/Modals.css';
import Polyglot from 'node-polyglot';
import config from '../../config/config.dev';
import { QRCodeSVG } from 'qrcode.react';

const Import: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    // const [loading, setLoading] = useState<boolean>(false);

    const navigate = useNavigate();
    const goToLogin = useCallback(() => navigate("/login", {replace: true}), [navigate]);

    const [stateToken, setStateToken] = useState<string>("");

    useEffect(() => {

        axios.get<importQRResponseDTO>(config.storeBackend.url+'/sync/import'
            ).then(res => {
                setStateToken(res.data.stateToken);
            })

    }, [])
    

    return (
        <div className = "gunet-container">
            <div className="container">
                <div className="row">
                    <h3>{polyglot.t('Import.header')}</h3>
                    {
                        stateToken &&
                        <QRCodeSVG value={stateToken} />
                    }
                </div>
                <Button variant="secondary" onClick={goToLogin}>
                    {polyglot.t('Import.buttonReturnLogin')}
                </Button>
            </div>
        </div>
    )

}

export default Import;