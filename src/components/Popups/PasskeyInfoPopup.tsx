import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FingerprintIcon, QrCodeIcon } from "lucide-react";
import PopupLayout from "./PopupLayout";
import { UsbStickDotIcon } from "../Shared/CustomIcons";
import Button from "../Buttons/Button";

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
	}

	return (
		<>
			<Button
				variant="link"
				onClick={handleOpen}
				linkClassName="font-semibold no-underline!"
				aria-expanded={isOpen}
				aria-haspopup="dialog"
			>
				{t('passkeyInfoPopup.triggerButton')}
			</Button>
			{isOpen && (
				<PopupLayout padding="p-4 md:p-8" isOpen={isOpen} onClose={handleClose} shouldCloseOnOverlayClick={true}>
					<div className="flex items-start justify-between mb-4" role="dialog" aria-modal="true" aria-labelledby="passkey-info-title">
						<h2 id="passkey-info-title" className="flex items-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-50 pr-6">
							{t('passkeyInfoPopup.title')}
						</h2>
						<button
							id="dismiss-passkey-info-popup"
							type="button"
							className="md:absolute top-6 right-6 text-lm-gray-900 dark:text-dm-gray-100 bg-transparent hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600 transition-all rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
							onClick={handleClose}
							aria-label={t('passkeyInfoPopup.closeAriaLabel')}
						>
							<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
							</svg>
						</button>
					</div>
					<div className="mb-6">
						<p className="mb-2">{t('passkeyInfoPopup.description1')}</p>
						<p className="mb-2">{t('passkeyInfoPopup.description2')}</p>
					</div>
					<ul>
						{Object.entries(passKeyTypes).map(([key, { label, description, icon: Icon }]) => (
							<li key={key} className="grid grid-cols-[40px_auto] md:grid-cols-[60px_auto] gap-4 py-4">
								<div className="border border-lm-gray-400 dark:border-dm-gray-600 rounded-lg aspect-square flex items-center justify-center" aria-hidden="true">
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
}

export default PasskeyInfoPopup;
