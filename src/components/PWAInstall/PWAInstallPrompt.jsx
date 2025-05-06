import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInstallMobile } from "react-icons/md";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDisplayArrowDown, faXmark } from '@fortawesome/pro-regular-svg-icons';

import useScreenType from '@/hooks/useScreenType';

import StatusContext from '@/context/StatusContext';

import Button from '@/components/Buttons/Button';

const PWAInstallPrompt = () => {
	//General
	const { t } = useTranslation();
	const { pwaInstallable, dismissPwaPrompt, hidePwaPrompt } = useContext(StatusContext);

	//Variables
	const screenType = useScreenType();

	//Render
	return (
		pwaInstallable && !hidePwaPrompt && (
			<div className={`w-full flex justify-center ${screenType === 'desktop' && 'mb-2'}`}>
				<div className='flex bg-c-lm-gray-300 dark:bg-c-dm-gray-700 dark:border-b dark:border-b-c-dm-gray-800 dark:border-t dark:border-t-c-dm-gray-600 dark:shadow-lg m-3 p-3 px-4 rounded-xl justify-between w-full sm:w-104'>
					<div 
						className='flex items-center cursor-pointer'
						onClick={() => pwaInstallable.prompt()}
					>
						{screenType !== 'desktop' ? (
							<MdInstallMobile className='text-c-lm-gray-900 dark:text-c-dm-gray-100 mr-3.5' size={32} />
						) : (
							<FontAwesomeIcon icon={faDisplayArrowDown} className='text-c-lm-gray-900 dark:text-c-dm-gray-100 text-2xl mr-3.5' />
						)}
						
						<span className={`text-c-lm-gray-900 dark:text-c-dm-gray-100 text-sm font-semibold`}>
							{t('pwaInstallPrompt.message')}
						</span>
					</div>

					<div className='flex items-center space-y'>
						<Button
							id="install-pwa-installable"
							variant="tertiary"
							additionalClassName='text-sm mr-3.5'
							onClick={() => pwaInstallable.prompt()}
						>
							{t('pwaInstallPrompt.button.install')}
						</Button>

						<button
							id="close-pwa-installable"
							className='flex items-center justify-center'
							title={t('pwaInstallPrompt.button.closeTitle')}
							onClick={dismissPwaPrompt}
						>
							<FontAwesomeIcon icon={faXmark} className='text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100 hover:text-c-lm-gray-800 dark:hover:text-c-dm-gray-200 transition-all duration-150' />
						</button>
					</div>
				</div>
			</div>
		)
	);
};

export default PWAInstallPrompt;
