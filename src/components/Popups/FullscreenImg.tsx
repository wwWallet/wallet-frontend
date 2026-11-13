import React from 'react';
import type { ReactNode } from 'react';
import Modal from 'react-modal';
import CloseButton from '../Buttons/CloseButton';

interface FullscreenImgProps {
	isOpen: boolean;
	onClose: () => void;
	content: ReactNode;
}

const FullscreenImg = ({ isOpen, onClose, content }: FullscreenImgProps) => {
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className="relative mx-2"
			overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50"
		>
			{content}
			<CloseButton
				id="close-full-screen-img"
				iconSize={32}
				onClick={onClose}
				additionalClassName="fixed top-4 right-4 z-50 !text-white !bg-black/40 enabled:hover:!bg-black/60 dark:!bg-white/15 dark:enabled:hover:!bg-white/25"
			/>
		</Modal>
	);
};

export default FullscreenImg;
