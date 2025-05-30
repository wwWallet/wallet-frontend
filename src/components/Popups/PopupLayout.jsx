// PopupLayout.js
import React from 'react';
import Modal from 'react-modal';
import Spinner from '../Shared/Spinner';
import Header from '../Layout/Header';

const PopupLayout = ({ isOpen, onClose, loading = false, fullScreen = false, children, padding = 'p-4', shouldCloseOnOverlayClick = true }) => {

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
			className={`bg-gray-50 dark:bg-gray-700 relative overflow-y-auto custom-scrollbar overflow-x-hidden ${fullScreen ? 'flex flex-col space-between w-full h-full' : 'w-full sm:w-1/2 md:w-5/12 lg:w-1/3 max-h-[90vh] rounded-lg shadow-lg m-4'}`}
			overlayClassName={`fixed inset-0  flex items-center justify-center ${fullScreen ? 'z-50' : 'bg-black bg-opacity-50 backdrop-blur-sm z-50'}`}
			bodyOpenClassName="overflow-hidden"
			shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
		>

			<div className={`${fullScreen && 'h-full'}`}>
				{fullScreen && <Header toggleSidebar={() => { }} />}
				<div className={`${padding} ${fullScreen && 'px-6 py-6 flex flex-col justify-between'}`}>
					{children}
				</div>
			</div>
		</Modal>
	);
};

export default PopupLayout;
