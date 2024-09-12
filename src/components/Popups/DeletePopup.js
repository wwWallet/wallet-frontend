import Modal from 'react-modal';
import { useTranslation } from 'react-i18next';
import { FaTrash } from 'react-icons/fa';
import Spinner from '../Spinner';
import Button from '../Buttons/Button';

const DeletePopup = ({ isOpen, onConfirm, onCancel, message, loading }) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	if (loading) {
		return (
			<Modal
				isOpen={true}
				onRequestClose={onCancel}
				className="absolute inset-0 flex items-center justify-center"
				overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			>
				<Spinner />
			</Modal>
		);
	}

	return (
		<Modal
			isOpen={true}
			onRequestClose={onCancel}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<h2 className="text-lg font-bold mb-2 text-red-500">
				<FaTrash size={20} className="inline mr-1 mb-1" />
				{t('pageSettings.title.confirmDeletePopup')}
			</h2>
			<hr className="mb-2 border-t border-red-500/80" />
			<p className="mb-2 mt-4 text-gray-700 dark:text-white">{message}</p>
			<div className="flex justify-end space-x-2 pt-4">
				<Button
					content={t('common.cancel')}
					onClick={onCancel}
					variant="cancel"
				/>
				<Button
					content={t('common.delete')}
					onClick={onConfirm}
					variant="delete"
				/>
			</div>
		</Modal>
	);
};

export default DeletePopup;
