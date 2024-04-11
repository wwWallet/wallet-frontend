import React from 'react';
import { MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import GetButton from '../../components/Buttons/GetButton';

const CredentialDeleteButton = ({ onDelete }) => {
	const { t } = useTranslation();

	const handleClick = () => {
		onDelete();
	};

	return (
		<div className="lg:p-0 p-2 w-full lg:mt-5 mt-2">
			<GetButton
				content={
					<>
						<MdDelete size={20} /> {t('common.delete')}
					</>
				}
				onClick={handleClick}
				variant="delete"
			/>
		</div>
	);
};

export default CredentialDeleteButton;
