// PopupLayout.js
import React, { useState } from 'react';
import Modal from 'react-modal';

import Header from '@/components/Layout/Header';
import Spinner from '@/components/Shared/Spinner';

const PopupLayout = ({ isOpen, isClosing, onClose, loading = false, fullScreen = false, children, className = '' }) => {

	if (!isOpen) return null;

	if (loading) {
		return (
			<Modal
				isOpen={true}
				className="absolute inset-0 flex items-center justify-center"
				overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
			>
				<Spinner size="small" />
			</Modal>
		);
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className={`
				popup-layout-opening ${isClosing ? 'popup-layout-closing' : ''}
				relative m-auto
				bg-c-lm-gray-100 dark:bg-c-dm-gray-900 border border-c-lm-gray-300 dark:border-c-dm-gray-800
				transition-all duration-200
				${fullScreen ? 'flex flex-col space-between w-full h-full' : 'p-6 w-full sm:w-1/2 md:w-5/12 lg:w-1/3 rounded-xl shadow-lg m-4'}
				${className}
			`}
			overlayClassName={`
				fixed inset-0 flex flex-col py-10 overflow-y-auto custom-scrollbar overflow-x-hidden
				${fullScreen ? 'z-50' : 'bg-black bg-opacity-50 backdrop-blur-sm z-50'}
				popup-overlay-opening ${isClosing ? 'popup-overlay-closing' : ''}
			`}
			bodyOpenClassName="overflow-hidden"
		>
			<div className={`${fullScreen && 'h-full'}`}>
				{fullScreen && <Header toggleSidebar={() => { }} />}
					
				<div className={`${fullScreen && 'px-6 py-6 flex flex-col justify-between'}`}>
					{children}
				</div>
			</div>
		</Modal>
	);
};

export default PopupLayout;
