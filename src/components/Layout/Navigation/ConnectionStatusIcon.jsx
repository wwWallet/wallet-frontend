import React, { useContext } from 'react';
import { PiWifiHighBold, PiWifiSlashBold } from "react-icons/pi";
import { useTranslation } from 'react-i18next';
import StatusContext from '../../../context/StatusContext';

const ConnectionStatusIcon = ({ size }) => {
	const { isOnline } = useContext(StatusContext);
	const { t } = useTranslation();

	return isOnline ? (
		<PiWifiHighBold size={size} title={t('common.online')} />
	) : (
		<PiWifiSlashBold size={size} title={t('common.offline')} />
	);
};

export default ConnectionStatusIcon;
