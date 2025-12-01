import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import StatusContext from '@/context/StatusContext';
import { Trash2 } from 'lucide-react';

const CredentialDeleteButton = ({ onDelete }) => {
	const { t } = useTranslation();
	const { isOnline } = useContext(StatusContext);

	const handleClick = () => {
		onDelete();
	};

	return (
		<Button
			id="credential-delete-button"
			onClick={handleClick}
			variant="delete"
			disabled={!isOnline}
			title={!isOnline && t('common.offlineTitle')}
			additionalClassName='xm:w-full'
		>
			<Trash2 size={18} /> {t('pageCredentials.delete')}
		</Button>
	);
};

export default CredentialDeleteButton;
