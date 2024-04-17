// FullscreenImg.js
import React from 'react';
import Modal from 'react-modal';
import { AiOutlineCloseCircle } from 'react-icons/ai';

const FullscreenImg = ({ isOpen, onClose, content }) => {
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="relative mx-2"
			overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
		>
			{content}
			<button
				className="fixed top-4 right-4 text-white text-2xl z-50"
				onClick={onClose}
			>
				<AiOutlineCloseCircle size={40} />
			</button>
		</Modal>
	);
};

export default FullscreenImg;
