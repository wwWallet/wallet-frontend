import React from 'react';
import { MdDelete } from 'react-icons/md';
import { useTranslation } from 'react-i18next';

const CredentialDeleteButton = ({ onDelete }) => {
	const { t } = useTranslation();

  const handleClick = () => {
    onDelete();
  };

  return (
		<div className=" lg:p-0 p-2 w-full">
			<button
				className="lg:mt-5 mt-2 text-white cursor-pointer flex items-center bg-red-600 hover:bg-red-800 font-medium rounded-lg text-sm px-4 py-2 text-center"
				onClick={handleClick}
			>
				<MdDelete size={20} /> {t('common.delete')}
			</button>
		</div>
  );
};

export default CredentialDeleteButton;
