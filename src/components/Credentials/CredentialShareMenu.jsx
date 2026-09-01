import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LoaderCircle, QrCode, Share2, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/Buttons/Button';
import SeparatorLine from '@/components/Shared/SeparatorLine';

const CredentialShareMenu = ({
	canShareWithQr,
	isOnline,
	verifiers,
	onShareWithQr,
	onSelectVerifier,
	align = 'right',
	fullWidth = false,
	largeButton = false,
}) => {
	const { t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef(null);
	const triggerRef = useRef(null);
	const hasVerifierOptions = verifiers === null || verifiers.length > 0;

	useEffect(() => {
		if (!isOpen) return;

		const closeOnOutsideClick = (event) => {
			if (!containerRef.current?.contains(event.target)) {
				setIsOpen(false);
			}
		};
		const closeOnEscape = (event) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				setIsOpen(false);
				triggerRef.current?.focus();
			}
		};

		document.addEventListener('mousedown', closeOnOutsideClick);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('mousedown', closeOnOutsideClick);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [isOpen]);

	const closeWhenFocusLeaves = (event) => {
		if (!containerRef.current?.contains(event.relatedTarget)) {
			setIsOpen(false);
		}
	};

	const selectAction = (action) => {
		setIsOpen(false);
		action();
	};

	return (
		<div
			ref={containerRef}
			onBlur={closeWhenFocusLeaves}
			className={`relative inline-block ${fullWidth ? 'w-full' : ''}`}
		>
			<Button
				ref={triggerRef}
				id="share-credential-menu"
				variant="primary"
				size={largeButton ? 'md' : 'sm'}
				additionalClassName={fullWidth ? 'w-full' : ''}
				onClick={() => setIsOpen((open) => !open)}
				ariaLabel={t('credentialShareMenu.buttonLabel')}
				title={t('credentialShareMenu.buttonLabel')}
				ariaExpanded={isOpen}
				ariaControls={isOpen ? 'share-credential-menu-popup' : undefined}
			>
				<Share2 size={20} aria-hidden="true" />
				<span>{t('credentialShareMenu.buttonLabel')}</span>
				<ChevronDown
					size={16}
					aria-hidden="true"
					className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
				/>
			</Button>

			{isOpen && (
				<div
					id="share-credential-menu-popup"
					role="group"
					aria-label={t('credentialShareMenu.buttonLabel')}
					className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} z-50 mt-2 w-[min(22rem,calc(100vw-3rem))] overflow-hidden rounded-lg border border-lm-gray-400 bg-lm-gray-100 p-1 shadow-lg dark:border-dm-gray-600 dark:bg-dm-gray-900`}
				>
					{canShareWithQr && (

						<>
							<p className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-base tracking-wide text-lm-gray-700 dark:text-dm-gray-300">
								{t('credentialShareMenu.nearbyDeviceHeading')}
							</p>
							<button
								id="share-credential-qr"
								type="button"
								className="flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm font-base text-lm-gray-900 hover:bg-lm-gray-300 dark:text-dm-gray-100 dark:hover:bg-dm-gray-700"
								onClick={() => selectAction(onShareWithQr)}
							>
								<QrCode size={20} className="shrink-0" aria-hidden="true" />
								{t('credentialShareMenu.showQrCode')}
							</button>
						</>

					)}

					{canShareWithQr && hasVerifierOptions && (
						<div className="my-1">
								<SeparatorLine><span className="uppercase">{t('common.or')}</span></SeparatorLine>
						</div>
					)}
					{hasVerifierOptions && (
						<div className={`${canShareWithQr ? ' border-lm-gray-400 dark:border-dm-gray-600' : ''}`}>
						<p className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-base tracking-wide text-lm-gray-700 dark:text-dm-gray-300">
								{t('credentialShareMenu.trustedVerifierHeading')}
						</p>

						{verifiers === null && (
							<div className="flex justify-center px-3 py-2" aria-busy="true">
								<LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
							</div>
						)}

						{verifiers?.length > 0 && (
							<div className="max-h-60 overflow-y-auto custom-scrollbar" role="group" aria-label={t('credentialShareMenu.trustedVerifierHeading')}>
								{verifiers.map((verifier) => (
									<button
										id={`share-credential-verifier-${verifier.id}`}
										key={verifier.id}
										type="button"
										disabled={!isOnline}
										title={!isOnline ? t('common.offlineTitle') : verifier.name}
										className="flex w-full items-center gap-3 rounded-md px-4 py-2.5 text-left text-sm text-lm-gray-900 enabled:cursor-pointer enabled:hover:bg-lm-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:text-dm-gray-100 dark:enabled:hover:bg-dm-gray-700"
										onClick={() => selectAction(() => onSelectVerifier(verifier))}
									>
										<ExternalLink size={20} className="shrink-0" aria-hidden="true" />

										<span className="min-w-0 truncate">{verifier.name}</span>
									</button>
								))}
							</div>
						)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default CredentialShareMenu;
