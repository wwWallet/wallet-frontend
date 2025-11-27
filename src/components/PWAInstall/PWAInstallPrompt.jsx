import React, { useContext } from 'react';
import Button from '@/components/Buttons/Button';
import StatusContext from '@/context/StatusContext';
import useScreenType from '@/hooks/useScreenType';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
	const { pwaInstallable, dismissPwaPrompt, hidePwaPrompt } = useContext(StatusContext);
	const screenType = useScreenType();
	const { t } = useTranslation();

	return (
		pwaInstallable && !hidePwaPrompt && (
			<div className={`w-full flex justify-center ${screenType === 'desktop' && 'mt-5'}`}>
				<div className='flex bg-c-lm-gray-300 dark:bg-c-dm-gray-700 m-3 p-3 rounded-lg shadow justify-between w-full sm:w-96'>
					<div className='flex items-center text-c-lm-gray-900 dark:text-c-dm-gray-100'>
						{screenType !== 'desktop' ? (
							<Download className='mr-2' size={32} />
						) : (
							<Download className='mr-2' size={32} />
						)}
						<a href="/" className={`font-semibold cursor-pointer transition-all duration-300 text-sm`}>
							{t('pwaInstallPrompt.message')}
						</a>
					</div>
					<div className='flex items-center space-y'>
						<Button
							id="install-pwa-installable"
							additionalClassName='text-sm mr-2'
							onClick={() => pwaInstallable.prompt()}
						>
							{t('pwaInstallPrompt.button.install')}
						</Button>
						<Button
							id="close-pwa-installable"
							square={true}
							size='sm'
							title={t('pwaInstallPrompt.button.closeTitle')}
							onClick={dismissPwaPrompt}
						>
							<X size={25} />
						</Button>
					</div>
				</div>
			</div>
		)
	);
};

export default PWAInstallPrompt;
