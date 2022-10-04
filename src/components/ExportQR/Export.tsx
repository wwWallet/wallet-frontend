import axios from 'axios';
import Polyglot from 'node-polyglot';
import React, { useEffect, useState } from 'react';
import { exportQRResponseDTO } from '../../interfaces/import-export-dto';
import config from '../../config/config.dev';
import { QRCodeSVG } from 'qrcode.react';

const Export: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {

    const [stateToken, setStateToken] = useState<string>("");

    useEffect(() => {

        axios.get<exportQRResponseDTO>(config.storeBackend.url+'/sync/import'
            ).then(res => {
                setStateToken(res.data.stateToken);
            })

    }, [])

    return (
        <React.Fragment>
            <h3>{polyglot.t('Export.buttonExport')}</h3>
            {
                stateToken &&
                <QRCodeSVG value={stateToken} />
            }
        </React.Fragment>
    )

}

export default Export;