import React, { useContext } from 'react';
import { MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import StatusContext from '@/context/StatusContext';

const CredentialDeleteButton = ({ onDelete, additionalClassName }) => {
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
			additionalClassName={`mt-4 ${additionalClassName}`}
		>
			<MdDelete size={20} className="mr-3" />
			{t('pageCredentials.delete')}
		</Button>
	);
};

export default CredentialDeleteButton;
