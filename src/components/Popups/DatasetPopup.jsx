// DeletePopup.js
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faTrash, faXmark } from '@fortawesome/pro-regular-svg-icons';

import Button from '@/components/Buttons/Button';
import PopupLayout from '@/components/Popups/PopupLayout';
import CredentialJson from '../Credentials/CredentialJson';

const DatasetPopup = ({ isOpen, onClose: onCloseProp, vcEntity, loading }) => {
	//General
	const { t } = useTranslation();

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

	return (
		<PopupLayout isOpen={isOpen} isClosing={isClosing} onClose={onClose} loading={loading} className="w-full sm:w-10/12 md:w-10/12 lg:w-8/12">
			<div className="flex items-start justify-between">
				<div className='flex items-center justify-center w-12 h-12 rounded-full bg-c-lm-gray-300 dark:bg-c-dm-gray-800'>
					<FontAwesomeIcon icon={faDatabase} className="text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100" />
				</div>

				<div className='flex-1 ml-4 mr-12'>
					<h2 className="text-xl font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{"Dataset"}
					</h2>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300 mb-5">
						{"This is the raw dataset of this credential. You can copy it to your clipboard and use it in your own application."}
					</p>

					<CredentialJson parsedCredential={vcEntity?.parsedCredential} textAreaRows='16' />

					<div className="flex items-center mt-5">
						<Button
							id="close-delete-popup"
							variant="cancel"
							onClick={onClose}
							size='md'
							textSize='md'
						>
							{"Close"}
						</Button>
					</div>
				</div>

				<button
					id="dismiss-delete-popup"
					type="button"
					className={`
						absolute top-2 right-2
						bg-c-lm-gray-200 dark:bg-c-dm-gray-800 rounded-lg w-8 h-8 flex justify-center items-center
						hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700 transition-all duration-150
					`}
					onClick={onClose}
				>
					<FontAwesomeIcon icon={faXmark} className="text-lg text-c-lm-gray-900 dark:text-c-dm-gray-100" />
				</button>
			</div>
		</PopupLayout>
	);
};

export default DatasetPopup;
