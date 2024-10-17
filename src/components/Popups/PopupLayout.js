// PopupLayout.js
import React from 'react';
import Modal from 'react-modal';
import Spinner from '../Shared/Spinner';
import Header from '../Layout/Header';

const PopupLayout = ({ isOpen, onClose, loading = false, fullScreen = false, children }) => {

	console.log('PopupLayout loading',loading)
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
			className={`bg-white dark:bg-gray-700 relative ${fullScreen ? 'w-full h-full' : 'p-4 w-2/3 md:w-5/12 lg:w-1/3 rounded-lg shadow-lg m-4'}`}
			overlayClassName={`fixed inset-0  flex items-center justify-center ${fullScreen ? 'z-50' : 'bg-black bg-opacity-50 backdrop-blur-sm z-50'}`}
			bodyOpenClassName="overflow-hidden"
		>

			{fullScreen && <Header toggleSidebar={() => { }} />}
			<div className={` ${fullScreen && 'p-4 pt-20 flex flex-col h-full justify-between'}`}>
				{children}
			</div>
		</Modal>
	);
};

export default PopupLayout;
