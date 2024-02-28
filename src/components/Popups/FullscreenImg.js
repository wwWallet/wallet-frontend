// FullscreenImg.js
import React from 'react';
import { AiOutlineCloseCircle } from 'react-icons/ai';

const FullscreenImg = ({ isOpen, onClose, content }) => {
	return (
		<>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<div className="relative mx-2">
						{content}
					</div>
					<button
						className="absolute top-4 right-4 text-white text-2xl z-10"
						onClick={onClose}
					>
						<AiOutlineCloseCircle size={40} />
					</button>
				</div>
			)}
		</>
	);
};

export default FullscreenImg;
