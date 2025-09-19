import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaDatabase } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

import Button from '@/components/Buttons/Button';
import PopupLayout from '@/components/Popups/PopupLayout';
import CredentialJson from '../Credentials/CredentialJson';

const DatasetPopup = ({ isOpen, onClose, vcEntity, loading }) => {
	const { t } = useTranslation();

	return (
		<PopupLayout 
			isOpen={isOpen} 
			onClose={onClose} 
			loading={loading} 
			padding="p-6"
		>
			<div className="flex items-start justify-between">
				<div className='flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800'>
					<FaDatabase className="text-xl text-gray-900 dark:text-gray-100" />
				</div>

				<div className='flex-1 ml-4 mr-12'>
					<h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">
						{t('pageCredentials.dataset.title')}
					</h2>

					<p className="mt-3 text-gray-700 dark:text-gray-300 mb-6">
						{t('pageCredentials.dataset.description')}
					</p>

					<CredentialJson 
						parsedCredential={vcEntity?.parsedCredential} 
						textAreaRows='16' 
					/>

					<div className="flex items-center mt-6">
						<Button
							id="close-dataset-popup"
							variant="cancel"
							onClick={onClose}
						>
								{t('common.close')}
						</Button>
					</div>
				</div>

				<button
					id="dismiss-dataset-popup"
					type="button"
					className="absolute top-3 right-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg w-8 h-8 flex justify-center items-center transition-all duration-150"
					onClick={onClose}
					aria-label="Close dataset popup"
				>
					<IoClose className="text-lg text-gray-900 dark:text-gray-100" />
				</button>
			</div>
		</PopupLayout>
	);
};

export default DatasetPopup;