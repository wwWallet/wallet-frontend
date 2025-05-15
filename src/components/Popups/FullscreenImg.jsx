import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const FullscreenImg = ({ isOpen, onClose: onCloseProp, content }) => {
	//State
	const [isClosing, setIsClosing] = useState(false);

	//Handlers
	const onClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onCloseProp();	
			setIsClosing(false);
		}, 200);
	}
	
	//Render
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className={`
				popup-layout-opening ${isClosing ? 'popup-layout-closing' : ''}
				relative mx-2
			`}
			overlayClassName={`
				fixed inset-0 flex items-center justify-center z-50

				bg-black bg-opacity-50 backdrop-blur-sm z-50
				popup-overlay-opening ${isClosing ? 'popup-overlay-closing' : ''}
			`}
		>
			{content}
			
			<button
				id="close-full-screen-img"
				type="button"
				className={`
					absolute top-3 right-3
					bg-c-lm-gray-200 dark:bg-c-dm-gray-800 rounded-lg w-8 h-8 flex justify-center items-center
					hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700 transition-all duration-150
				`}
				onClick={onClose}
			>
				<FontAwesomeIcon icon={faXmark} className="text-lg text-c-lm-gray-900 dark:text-c-dm-gray-100" />
			</button>
		</Modal>
	);
};

export default FullscreenImg;
