import React, { useContext } from 'react';
import Button from '@/components/Buttons/Button';
import StatusContext from '@/context/StatusContext';
import { IoClose } from "react-icons/io5";
import { MdInstallMobile, MdInstallDesktop } from "react-icons/md";
import useScreenType from '@/hooks/useScreenType';
import { useTranslation } from 'react-i18next';

const PWAInstallPrompt = () => {
	const { appSettings } = useContext(StatusContext);
	const { pwaInstallable, dismissPwaPrompt, hidePwaPrompt } = appSettings;
	const screenType = useScreenType();
	const { t } = useTranslation();

	console.log('pwaInstallable', pwaInstallable)
	return (
		pwaInstallable && !hidePwaPrompt && (
			<div className={`w-full flex justify-center ${screenType === 'desktop' && 'mt-5'}`}>
				<div className='flex bg-gray-600 m-3 p-3 rounded-md shadow justify-between w-full sm:w-96'>
					<div className='flex items-center'>
						{screenType !== 'desktop' ? (
							<MdInstallMobile className='text-white mr-2' size={32} />
						) : (
							<MdInstallDesktop className='text-white mr-2' size={32} />
						)}
						<a href="/" className={`text-white font-semibold cursor-pointer transition-all duration-300 text-sm`}>
							{t('pwaInstallPrompt.message')}
						</a>
					</div>
					<div className='flex items-center space-y'>

						<Button variant="tertiary" additionalClassName='text-sm mr-2' onClick={() => pwaInstallable.prompt()}>
							{t('pwaInstallPrompt.button.install')}
						</Button>
						<button className='text-white' title={t('pwaInstallPrompt.button.closeTitle')} onClick={dismissPwaPrompt}>
							<IoClose size={25} />
						</button>
					</div>
				</div>
			</div>
		)
	);
};

export default PWAInstallPrompt;
