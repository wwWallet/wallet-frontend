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
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
		>
			{content}
			<button
				id="close-full-screen-img"
				className="fixed top-4 right-4 text-white text-2xl z-50"
				onClick={onClose}
			>
				<AiOutlineCloseCircle size={40} />
			</button>
		</Modal>
	);
};

export default FullscreenImg;
