import React, { useContext } from 'react';
import { MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import OnlineStatusContext from '../../context/OnlineStatusContext';

const CredentialDeleteButton = ({ onDelete }) => {
	const { t } = useTranslation();
	const { isOnline } = useContext(OnlineStatusContext);

	const handleClick = () => {
		onDelete();
	};

	return (
		<div className="lg:p-0 p-2 w-full lg:mt-5 mt-2">
			<Button
				content={
					<>
						<MdDelete size={20} /> {t('common.delete')}
					</>
				}
				onClick={handleClick}
				variant="delete"
				disabled={!isOnline}
				title={!isOnline && t('common.offlineTitle')}

			/>
		</div>
	);
};

export default CredentialDeleteButton;
