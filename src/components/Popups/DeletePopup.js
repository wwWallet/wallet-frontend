import { useTranslation } from 'react-i18next';
import { FaTrash } from 'react-icons/fa';
import Spinner from '../Spinner';

const DeletePopup = ({ isOpen, onConfirm, onCancel, message, loading }) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50"></div>
			<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
				{loading ? (
					<div className="flex items-center justify-center h-24">
						<Spinner />
					</div>
				) : (
					<>
						<h2 className="text-lg font-bold mb-2 text-red-600">
							<FaTrash size={20} className="inline mr-1 mb-1" />
							{t('pageSettings.title.confirmDeletePopup')}
						</h2>
						<hr className="mb-2 border-t border-red-600/80" />
						<p className="mb-2 mt-4">{message}</p>
						<div className="flex justify-end space-x-2 pt-4">
							<button
								className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
								onClick={onCancel}
							>
								{t('common.cancel')}
							</button>
							<button
								className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
								onClick={onConfirm}
							>
								{t('common.delete')}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default DeletePopup;