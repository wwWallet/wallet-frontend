import React, { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import PopupLayout from './PopupLayout';
import { FaShare, FaRegCircle, FaCheckCircle } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';
import CredentialImage from '../Credentials/CredentialImage';
import CredentialInfo from '../Credentials/CredentialInfo';
import Button from '../Buttons/Button';
import SessionContext from '@/context/SessionContext';
import useScreenType from '../../hooks/useScreenType';
import Slider from '../Shared/Slider';
import CredentialParserContext from '@/context/CredentialParserContext';
import CredentialCardSkeleton from '../Skeletons/CredentialCardSkeleton';
import { CredentialInfoSkeleton } from '../Skeletons';

const formatTitle = (title) => {
	if (title) {
		return title.replace(/([a-z])([A-Z])/g, '$1 $2');
	} else {
		return;
	}
};



function GenericConsentPopup({ popupConsentState, setPopupConsentState, showConsentPopup, hidePopupConsent }) {

	const screenType = useScreenType();

	const reinitialize = useCallback(() => {
		setPopupConsentState({ isOpen: false });
	}, [setPopupConsentState]);
  

	useEffect(() => {
		if (popupConsentState?.options) {
		}
	}, [popupConsentState]);


	const consent = () => {
		popupConsentState.resolve();
	}

	const onClose = () => {
		// setIsOpen(false);
		popupConsentState.reject();
		reinitialize();
		// navigate('/');
	}

	if (!popupConsentState?.isOpen) {
		return null;
	};



	return (
		<PopupLayout isOpen={popupState?.isOpen} onClose={onClose} loading={false} fullScreen={screenType !== 'desktop'}>
			<div className={`${screenType !== 'desktop' && 'pb-16'}`}>
				<div>
					<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
					<p className="text-gray-700 italic dark:text-white text-sm mt-2 mb-4">
						{t('selectCredentialPopup.descriptionSelect')}
					</p>

				</div>

				<div className={`flex justify-between pt-4 z-10 ${screenType !== 'desktop' && 'fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex px-6 pb-6 flex shadow-2xl rounded-t-lg w-auto'}`}>
					<Button
						id="cancel-select-credentials"
						onClick={onClose}
						variant="cancel"
						className="mr-2"
					>
						{t('common.cancel')}
					</Button>

					<div className="flex gap-2">
						<Button
							id="consent"
							variant="secondary"
							onClick={consent}>
							{t('common.navItemSendCredentialsSimple')}
						</Button>
					</div>
				</div>
			</div>

		</PopupLayout >
	);
}

export default SelectCredentialsPopup;
