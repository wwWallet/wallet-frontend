import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import { Trash2 } from 'lucide-react';


const CredentialDeleteButton = ({ onDelete }) => {
	const { t } = useTranslation();

	const handleClick = () => {
		onDelete();
	};

	return (
		<Button
			id="credential-delete-button"
			onClick={handleClick}
			variant="delete"
			title={t('common.offlineTitle')}
			additionalClassName='xm:w-full'
		>
			<Trash2 size={18} /> {t('pageCredentials.delete')}
		</Button>
	);
};

export default CredentialDeleteButton;
