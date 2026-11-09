import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import { Trash2 } from 'lucide-react';

interface CredentialDeleteButtonProps {
	onDelete: () => void;
}

const CredentialDeleteButton = ({ onDelete }: CredentialDeleteButtonProps) => {
	const { t } = useTranslation();

	return (
		<Button
			id="credential-delete-button"
			onClick={onDelete}
			variant="invisible"
			title={t('pageCredentials.delete')}
			additionalClassName="w-full justify-start !shadow-none text-lm-red-dark dark:text-red-400 hover:!bg-lm-gray-400 dark:hover:!bg-dm-gray-600"
		>
			<Trash2 size={18} aria-hidden="true" />
			{t('pageCredentials.delete')}
		</Button>
	);
};

export default CredentialDeleteButton;
