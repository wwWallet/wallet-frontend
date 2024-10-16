// PopupLayout.js
import React from 'react';
import Modal from 'react-modal';
import Spinner from '../Shared/Spinner';

const PopupLayout = ({ isOpen, onClose, loading=false, children }) => {

	if (!isOpen) return null;

	if (loading) {
		return (
			<Modal
				isOpen={true}
				className="absolute inset-0 flex items-center justify-center"
				overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			>
				<Spinner />
			</Modal>
		);
	}
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
			bodyOpenClassName="overflow-hidden"
		>
			{children}
		</Modal>
	);
};

export default PopupLayout;
