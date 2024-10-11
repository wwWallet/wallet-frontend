import React, { useContext } from 'react';
import { MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import StatusContext from '../../context/StatusContext';

const CredentialDeleteButton = ({ onDelete }) => {
	const { t } = useTranslation();
	const { isOnline } = useContext(StatusContext);

	const handleClick = () => {
		onDelete();
	};

	return (
		<Button
			onClick={handleClick}
			variant="delete"
			disabled={!isOnline}
			title={!isOnline && t('common.offlineTitle')}
		>
			<MdDelete size={20} /> {t('common.delete')}
		</Button>
	);
};

export default CredentialDeleteButton;
