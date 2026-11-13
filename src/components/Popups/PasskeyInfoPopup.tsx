import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FingerprintIcon, QrCodeIcon } from 'lucide-react';
import PopupLayout from './PopupLayout';
import { UsbStickDotIcon } from '../Shared/CustomIcons';
import CloseButton from '../Buttons/CloseButton';

const PasskeyInfoPopup = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation();

	const handleOpen = () => {
		setIsOpen(true);
	};

	const handleClose = () => {
		setIsOpen(false);
	};

	const passKeyTypes = {
		onDevice: {
			label: t('passkeyInfoPopup.onDeviceLabel'),
			description: t('passkeyInfoPopup.onDeviceDescription'),
			icon: FingerprintIcon,
		},
		securityKey: {
			label: t('passkeyInfoPopup.securityKeyLabel'),
			description: t('passkeyInfoPopup.securityKeyDescription'),
			icon: UsbStickDotIcon,
		},
		otherDevice: {
			label: t('passkeyInfoPopup.otherDeviceLabel'),
			description: t('passkeyInfoPopup.otherDeviceDescription'),
			icon: QrCodeIcon,
		},
	};

	return (
		<>
			<button
				className="relative mt-4 p-6 sm:px-12 w-full flex justify-center cursor-pointer font-semibold rounded-lg hover:bg-lm-gray-200 hover:dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 hover:border-lm-gray-600 dark:hover:border-dm-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2"
				onClick={handleOpen}
			>
				{t('passkeyInfoPopup.triggerButton')}
			</button>
			{isOpen && (
				<PopupLayout padding="p-4 md:p-8" isOpen={isOpen} onClose={handleClose} shouldCloseOnOverlayClick={true}>
					<div
						className="flex items-start justify-between mb-4"
						role="dialog"
						aria-modal="true"
						aria-labelledby="passkey-info-title"
					>
						<h2
							id="passkey-info-title"
							className="flex items-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-50 pr-6"
						>
							{t('passkeyInfoPopup.title')}
						</h2>
						<CloseButton
							id="dismiss-passkey-info-popup"
							onClick={handleClose}
							ariaLabel={t('passkeyInfoPopup.closeAriaLabel')}
							additionalClassName="md:absolute top-6 right-6 ml-auto"
						/>
					</div>
					<div className="mb-6 space-y-2">
						<p>{t('passkeyInfoPopup.description1')}</p>
						<p>{t('passkeyInfoPopup.description2')}</p>
					</div>
					<ul>
						{Object.entries(passKeyTypes).map(([key, { label, description, icon: Icon }]) => (
							<li key={key} className="grid grid-cols-[40px_auto] md:grid-cols-[60px_auto] gap-4 py-4">
								<div
									className="border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg aspect-square flex items-center justify-center"
									aria-hidden="true"
								>
									<Icon size={30} className="text-primary dark:text-white" />
								</div>
								<div>
									<h3 className="mb-2 font-bold text-lm-gray-900 dark:text-dm-gray-50">{label}</h3>
									<p className="text-sm">{description}</p>
								</div>
							</li>
						))}
					</ul>
				</PopupLayout>
			)}
		</>
	);
};

export default PasskeyInfoPopup;
