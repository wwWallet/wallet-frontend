import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/pro-regular-svg-icons';

import StatusContext from '@/context/StatusContext';

import Button from '@/components/Buttons/Button';

const CredentialDeleteButton = ({ onDelete }) => {
	//General
	const { t } = useTranslation();
	const { isOnline } = useContext(StatusContext);

	//Handlers
	const handleClick = () => {
		onDelete();
	};

	//Render
	return (
		<Button
			id="credential-delete-button"
			onClick={handleClick}
			variant="delete"
			disabled={!isOnline}
			title={!isOnline && t('common.offlineTitle')}
			additionalClassName='xm:w-full mt-4'
			size='lg'
			textSize='md'
		>
			<FontAwesomeIcon icon={faTrash} className='text-md mr-3' />
			
			{t('pageCredentials.delete')}
		</Button>
	);
};

export default CredentialDeleteButton;
